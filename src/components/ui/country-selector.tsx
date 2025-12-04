"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { countries, arabCountries, type Country } from "@/lib/countries";

interface CountrySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onlyArab?: boolean;
  className?: string;
}

interface MultiCountrySelectorProps {
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onlyArab?: boolean;
  className?: string;
  maxDisplay?: number;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = "اختر الدولة",
  disabled = false,
  onlyArab = false,
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const countryList = onlyArab ? arabCountries : countries;
  
  const selectedCountry = countryList.find(c => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="rtl:inline hidden">{selectedCountry.nameAr}</span>
              <span className="ltr:inline hidden">{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن دولة..." className="h-9" />
          <CommandList>
            <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {countryList.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.nameAr}`}
                  onSelect={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{country.flag}</span>
                    <span className="rtl:inline hidden">{country.nameAr}</span>
                    <span className="ltr:inline hidden">{country.name}</span>
                  </span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MultiCountrySelector({
  value = [],
  onChange,
  placeholder = "اختر الدول",
  disabled = false,
  onlyArab = false,
  className,
  maxDisplay = 3,
}: MultiCountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const countryList = onlyArab ? arabCountries : countries;
  
  const selectedCountries = countryList.filter(c => value.includes(c.code));

  const handleToggle = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter(v => v !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const displayText = () => {
    if (selectedCountries.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }
    if (selectedCountries.length <= maxDisplay) {
      return (
        <span className="flex items-center gap-1 flex-wrap">
          {selectedCountries.map(c => (
            <span key={c.code} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-sm">
              {c.flag}
              <span className="rtl:inline hidden">{c.nameAr}</span>
              <span className="ltr:inline hidden">{c.name}</span>
            </span>
          ))}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        {selectedCountries.slice(0, maxDisplay).map(c => (
          <span key={c.code} className="text-lg">{c.flag}</span>
        ))}
        <span className="text-sm text-muted-foreground">
          +{selectedCountries.length - maxDisplay} دولة أخرى
        </span>
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between min-h-[40px] h-auto", className)}
        >
          {displayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن دولة..." className="h-9" />
          <CommandList>
            <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {countryList.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.nameAr}`}
                  onSelect={() => handleToggle(country.code)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={value.includes(country.code)}
                      className="pointer-events-none"
                    />
                    <span className="text-lg">{country.flag}</span>
                    <span className="rtl:inline hidden">{country.nameAr}</span>
                    <span className="ltr:inline hidden">{country.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CountryDisplay({ code, showFlag = true }: { code: string; showFlag?: boolean }) {
  const country = countries.find(c => c.code === code);
  if (!country) return <span>{code}</span>;
  
  return (
    <span className="flex items-center gap-1">
      {showFlag && <span className="text-lg">{country.flag}</span>}
      <span className="rtl:inline hidden">{country.nameAr}</span>
      <span className="ltr:inline hidden">{country.name}</span>
    </span>
  );
}
