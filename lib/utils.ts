import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateMonthOptions(count:number = 6):string[]{
  const options:string[] = [];
  const now = new Date();
  for(let i=0;i<count;i++){
    const d = new Date(now.getFullYear(),now.getMonth()-i,1);
    const label = d.toLocaleDateString("en-US",{month:"long",year:"numeric"})
    options.push(label);
  }
  return options;
}