"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countries, arabCountries, type Country } from "@/lib/countries";

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  onlyArab?: boolean;
  className?: string;
}

const phoneCountries = countries.filter(c => c.dialCode);

export function PhoneInputWithCountry({
  value = "",
  onChange,
  defaultCountry = "SA",
  placeholder,
  disabled = false,
  onlyArab = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<Country | undefined>(
    () => phoneCountries.find(c => c.code === defaultCountry) || phoneCountries[0]
  );
  const [phoneNumber, setPhoneNumber] = React.useState("");

  const countryList = onlyArab 
    ? arabCountries.filter(c => c.dialCode)
    : phoneCountries;

  React.useEffect(() => {
    if (defaultCountry) {
      const country = phoneCountries.find(c => c.code === defaultCountry);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [defaultCountry]);

  React.useEffect(() => {
    if (value) {
      const country = phoneCountries.find(c => c.dialCode && value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode || "", "").trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    const fullNumber = `${country.dialCode}${phoneNumber}`;
    onChange(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d]/g, "");
    setPhoneNumber(newNumber);
    if (selectedCountry?.dialCode) {
      onChange(`${selectedCountry.dialCode}${newNumber}`);
    } else {
      onChange(newNumber);
    }
  };

  return (
    <div className={cn("flex gap-2", className)} dir="ltr">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-[140px] justify-between shrink-0"
          >
            {selectedCountry ? (
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                <span className="rtl:inline hidden">اختر</span>
                <span className="ltr:inline hidden">Select</span>
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search / ابحث..." 
              className="h-9" 
            />
            <CommandList>
              <CommandEmpty>
                <span className="rtl:inline hidden">لم يتم العثور على نتائج</span>
                <span className="ltr:inline hidden">No results found</span>
              </CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {countryList.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.nameAr} ${country.dialCode} ${country.code}`}
                    onSelect={() => handleCountryChange(country)}
                  >
                    <span className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-mono text-sm w-14">{country.dialCode}</span>
                      <span className="rtl:inline hidden text-sm">{country.nameAr}</span>
                      <span className="ltr:inline hidden text-sm">{country.name}</span>
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="relative flex-1">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || "رقم الهاتف"}
          disabled={disabled}
          className="pl-10"
          dir="ltr"
        />
      </div>
    </div>
  );
}

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  
  const country = phoneCountries.find(c => c.dialCode && phone.startsWith(c.dialCode));
  if (country && country.dialCode) {
    const number = phone.replace(country.dialCode, "");
    return `${country.flag} ${country.dialCode} ${number}`;
  }
  
  return phone;
}

export function getCountryFromPhone(phone: string | null | undefined): Country | undefined {
  if (!phone) return undefined;
  return phoneCountries.find(c => c.dialCode && phone.startsWith(c.dialCode));
}
