import { run } from "node-telegram-bot-api/node";
import { bot } from "../telegram"
import { prisma } from "../prisma";
import { calculateLedgerBalances, getSettlementAllowance, isCompanyBankAccount, splitEqually } from "../finance";
import { expenseStates } from "./state";
import { SettlementStatus } from "@/app/generated/prisma/enums";

async function getWorkspaceBalances() {
    const [users, expenses, settlements] = await Promise.all([
        prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.expense.findMany({ include: { splits: true } }),
        prisma.settlement.findMany({ where: { status: SettlementStatus.COMPLETED } }),
    ]);

    return calculateLedgerBalances(users, expenses, settlements);
}

async function recordBotExpense(input: { amountPaid: number; transactionId: string; description: string; paidById: string }) {
    const allUsers = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true } });
    if (!allUsers.some((user) => user.id === input.paidById)) {
        throw new Error("The expense payer is not an authorized workspace user.");
    }
    const humanPartners = allUsers.filter((user) => !isCompanyBankAccount(user));
    if (humanPartners.length === 0) {
        throw new Error("No human partners found to split expense.");
    }
    return prisma.expense.create({
        data: {
            ...input,
            splits: { create: splitEqually(input.amountPaid, humanPartners.map((partner) => partner.id)) },
        },
    });
}

async function recordBotSettlement(input: { fromUserId: string; toUserId: string; amountPaid: number }) {
    if (input.fromUserId === input.toUserId) throw new Error("A partner cannot settle with themselves.");
    const [users, expenses, completedSettlements, pendingSettlements] = await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true } }),
        prisma.expense.findMany({ select: { paidById: true, amountPaid: true, isExtraFund: true, splits: { select: { userId: true, amountPaid: true } } } }),
        prisma.settlement.findMany({ where: { status: SettlementStatus.COMPLETED }, select: { fromUserId: true, toUserId: true, amountPaid: true, status: true } }),
        prisma.settlement.findMany({ where: { status: SettlementStatus.PENDING }, select: { fromUserId: true, toUserId: true, amountPaid: true } }),
    ]);
    const maximum = getSettlementAllowance(
        calculateLedgerBalances(users, expenses, completedSettlements),
        pendingSettlements,
        input.fromUserId,
        input.toUserId,
        users.filter(isCompanyBankAccount).map((account) => account.id)
    );
    if (input.amountPaid > maximum) throw new Error(`Settlement exceeds the outstanding amount of ₹${maximum.toLocaleString("en-IN")}.`);
    return prisma.settlement.create({
        data: { ...input, status: SettlementStatus.COMPLETED, settledAt: new Date() },
        include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } },
    });
}


bot.command("start", async (ctx) => {

    const telegramUserID = String(ctx.from?.id);

    if (!telegramUserID) {
        return ctx.reply("Something went Wrong!")
    }

    const user = await prisma.user.findUnique({
        where: {
            telegramUserID
        }
    })

    if (user) {
        await ctx.reply(`👋 Welcome Back ${user.name}!`)
    } else {
        await ctx.reply(`👋 Welcome to Partner Finance Tracker Bot!

❌ Your Telegram account is not linked. To get started, please create an account:`)
    }

});

bot.command("add", async (ctx) => {
    const telegramUserID = String(ctx.from?.id);
    const user = await prisma.user.findUnique({
        where: {
            telegramUserID
        }
    })

    if (!user) {
        await ctx.reply("❌ Your Telegram account is not linked.");
        return;
    }

    if (!ctx.from?.id) {
        await ctx.reply("❌ Unable to identify user.");
        return;
    }

    expenseStates.set(ctx.from.id, {
        step: "amount",
    })
    await ctx.reply("💰 How much did you spend?");
})

bot.command("balance", async (ctx) => {
    const telegramUserID = String(ctx.from?.id);
    const user = await prisma.user.findUnique({
        where: {
            telegramUserID
        },
    })
    if (!user) {
        await ctx.reply("❌ Your Telegram account is not linked.")
        return;
    }

    const balances = await getWorkspaceBalances();
    const message = balances.map((person) => {
        if (person.companyDue > 0) {
            return `🔴 ${person.name}: owes company ₹${person.companyDue.toLocaleString("en-IN")}`;
        }
        if (person.balance > 0) {
            return `🟢 ${person.name}: receives ₹${person.balance.toLocaleString("en-IN")}`;
        }

        if (person.balance < 0) {
            return `🔴 ${person.name}: owes ₹${Math.abs(person.balance)}`;
        }

        return `🟢🟡⚪  ${person.name}: settled!`;

    }).join("\n")

    await ctx.reply(`💰 Current Balance\n\n${message}`)
})

bot.command("settle", async (ctx) => {
    const telegramUserID = String(ctx.from?.id);
    const user = await prisma.user.findUnique({
        where: {
            telegramUserID
        }
    });

    if (!user) {
        await ctx.reply("❌ Your Telegram account is not linked.");
        return;
    }

    const partners = await prisma.user.findMany({
        where: {
            id: {
                not: user.id
            }
        },
        orderBy: {
            createdAt: "asc"
        }
    })

    if (partners.length === 0) {
        await ctx.reply("❌ No partners found.")
    }
    const buttons = partners.map((partner) => [{
        text: partner.name,
        callback_data: `settle_to:${partner.id}`
    }]);

    await ctx.reply("💰 Who did you settle up with?", {
        reply_markup: {
            inline_keyboard: buttons,
        }
    })




})

bot.command("expenses",async(ctx)=>{
    const telegramUserID = String(ctx.from?.id);
    const user = await prisma.user.findUnique({
        where:{
            telegramUserID
        }
    })
    if(!user){
        await ctx.reply("❌ Your Telegram account is not linked.");
        return;
    }
    try{

    
    const expenses = await prisma.expense.findMany({
        include: { paidBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
    if(expenses.length===0){
        await ctx.reply("📭 No expenses found.");
        return;
    }

    const recentExpense = expenses;
    const message = recentExpense.map((expense: { amountPaid: number; description: string; paidBy: { name: string }; createdAt: Date }, index: number) => {
    const date = new Date(expense.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
    return `${index + 1}. 💰 ₹${expense.amountPaid}
📝 ${expense.description}
👤 Paid by: ${expense.paidBy.name}
📅 ${date}`;
            })
            .join("\n\n");

        await ctx.reply(
            `📋 Recent Expenses\n\n${message}`
        );
    
    } catch(error){
        console.log(error);
        await ctx.reply("❌ Failed to fetch expenses.");
    }

});

bot.command("settlements",async(ctx)=>{
    const telegramUserID = String(ctx.from?.id);
    const user = await prisma.user.findUnique({
        where:{
            telegramUserID
        }
    });

    if(!user){
        await ctx.reply("❌ Your Telegram account is not linked.");
        return;
    }

    try{
        const settlements = await prisma.settlement.findMany({
            include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } },
            orderBy: { settledAt: "desc" },
            take: 10,
        });
        if(!settlements || settlements.length===0){
            await ctx.reply("No settlements found.");
            return;

        }
        const recentSettlements =
            settlements;

        const message = recentSettlements
            .map(
                (
                    settlement: { amountPaid: number; fromUser: { name: string }; toUser: { name: string }; settledAt: Date | null },
                    index: number
                ) => {
                    const date = (settlement.settledAt ?? new Date()).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }
                    );

                    return `${index + 1}. 💸 ₹${settlement.amountPaid}
👤 ${settlement.fromUser.name} → ${settlement.toUser.name}
📅 ${date}`;
                }
            )
            .join("\n\n");

        await ctx.reply(
            `💸 Recent Settlements\n\n${message}`
        );

    } catch (error) {
        console.error(error);

        await ctx.reply(
            "❌ Failed to fetch settlements."
        );
    }
        
        
        
    

})

bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if(!data) return;
    const match = data.match(/^settle_to:(.+)$/);
    if(!match) return;
    const toUserID = match[1];
    if(match && ctx.from?.id){
        const toUserId = match[1];
        expenseStates.set(ctx.from.id,{
            step:"settleAmount",
            toUserId
        })
    }

    await ctx.answerCallbackQuery();
    const partner = await prisma.user.findUnique({
        where:{
            id:toUserID
        },
        select:{
            name:true
        }
    })

    if(!partner){
        await ctx.reply("❌ Partner not found.");
        if (ctx.from?.id) {
            expenseStates.delete(ctx.from.id);
        }
        return;
    }

    await ctx.reply(
        `💸 You selected: ${partner.name}

💰 How much did you pay?`
    );
})
bot.on("message", async (ctx) => {
    if (!ctx.from?.id) return;
    const fromId = ctx.from.id;
    const state = expenseStates.get(fromId);

    if (!state) {
        return;
    }

    const text = ctx.message?.text?.trim();

    if (text?.startsWith("/")) {
        return;
    }
    if(state.step==="settleAmount"){
        const amount = Number(text);
        if(!Number.isFinite(amount) || amount<=0){
            await ctx.reply("❌ Please enter a valid amount")
            return;
        }
        state.settleAmount = amount;
        state.step = "settleConfirm";
        const partner = await prisma.user.findUnique({
            where:{
                id:state.toUserId
            },
            select:{
                name:true
            }
        })
        await ctx.reply(
    `💸 Settlement Summary

👤 Paid to: ${partner?.name}
💰 Amount: ₹${amount}

Reply:

YES → Confirm
NO → Cancel`
  );

  return;
    }

    if(state.step==="settleConfirm"){
        const answer = text?.toLowerCase();
        if(answer === "no"){
            expenseStates.delete(fromId);
            await ctx.reply("❌ Transaction cancelled");
            return;
        }

        if(answer !== "yes"){
            await ctx.reply("⚠️ Please reply with YES or NO");
            return;
        }

        const telegramUserID = String(fromId);
        const user = await prisma.user.findUnique({
            where:{
                telegramUserID
            }
        })

        if(!user || !state.toUserId || !state.settleAmount){
            expenseStates.delete(fromId);

    await ctx.reply(
      "❌ Unable to process settlement."
    );

    return;
        }

        try{
            const settlement = await recordBotSettlement({
                fromUserId: user.id,
                toUserId: state.toUserId,
                amountPaid: Math.round(state.settleAmount),
            });
             await ctx.reply(
      `✅ Settlement recorded successfully!

💸 Amount: ₹${settlement.amountPaid}

👤 From: ${settlement.fromUser.name}
👤 To: ${settlement.toUser.name}`
    );

        }
        catch(error){
            console.log(error);
            await ctx.reply("❌ Failed to record settlement.");
        }
        finally{
            expenseStates.delete(fromId);
            return;
        }
    }
    if (state.step === "amount") {
        const amount = Number(text);
        if (!Number.isFinite(amount) || amount <= 0) {
            await ctx.reply("❌ Please enter a valid amount.\n\nExample: 5000");
            return;
        }


        state.amount = amount;
        state.step = "transactionId";

        await ctx.reply("🔍 Please enter the Transaction ID or UPI Reference Number");
        return;
    }

    if (state.step === "transactionId") {
        state.transactionId = text
        state.step = "description";
        await ctx.reply("📝 Please add a description (e.g., Groceries, Dinner)");
        return;
    }

    if (state.step === "description") {
        state.description = text;
        state.step = "confirm";

        await ctx.reply(`💰 Amount: ₹${state.amount}
🧾 Transaction ID: ${state.transactionId}
📝 Description: ${state.description}

Reply with:

YES → Confirm
NO → Cancel`);
        return;
    }

    if (state.step === "confirm") {
        const answer = text?.toLowerCase();
        if (answer === "no") {
            expenseStates.delete(fromId);
            await ctx.reply("❌ Transaction cancelled");
            return;
        }
        if (answer !== "yes") {
            await ctx.reply("⚠️ Please reply with YES or NO");
            return;
        }

        const telegramUserID = String(fromId);
        const user = await prisma.user.findUnique({
            where: {
                telegramUserID
            }
        })

        if (!user || !state.amount || !state.transactionId || !state.description) {
            expenseStates.delete(fromId);
            await ctx.reply("❌ Your Telegram account is not linked.")
            return;
        }
        try {
            const expense = await recordBotExpense({
                amountPaid: state.amount,
                transactionId: state.transactionId,
                description: state.description,
                paidById: user.id,
            });
            await ctx.reply(`✅ Expense added!
                💰 ₹${expense.amountPaid}
                📝 ${expense.description}`
            )
        }
        catch (error) {
            console.log(error);
            await ctx.reply("❌ Failed to add expense");
        }
        finally {
            expenseStates.delete(fromId);
        }

    }

})

run(bot);
