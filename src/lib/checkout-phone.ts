import { z } from "zod";

/** Normalize national, leading-zero local, or +234 numbers without truncating server input. */
export function nationalPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length > 10) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function phoneInputDigits(value: string): string {
  return nationalPhoneDigits(value).slice(0, 10);
}

type CheckoutPhones = { phone: string; contactPhone: string; contactPhoneEdited: boolean };

export function updateCheckoutPhone<T extends CheckoutPhones>(current: T, field: "phone" | "contactPhone", value: string): T {
  const digits = phoneInputDigits(value);
  if (field === "contactPhone") return { ...current, contactPhone: digits, contactPhoneEdited: true };
  return { ...current, phone: digits, contactPhone: current.contactPhoneEdited ? current.contactPhone : digits };
}

export const checkoutPhoneSchema = z.string().trim()
  .regex(/^[+\d\s()-]+$/, "Enter a valid Nigerian mobile number")
  .transform((value) => `+234${nationalPhoneDigits(value)}`)
  .pipe(z.string().regex(/^\+234[789]\d{9}$/, "Enter the 10 digits after +234, without the first 0"));
