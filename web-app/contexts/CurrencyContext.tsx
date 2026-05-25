'use client'

import React from 'react'

const currencies = [
    { code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupee', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.022 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.020 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.017 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1.85 },
]

type CurrencyContextType = {
    currency: typeof currencies[0]
    setCurrency: (currency: typeof currencies[0]) => void
    convertPrice: (price: number) => string
}

const CurrencyContext = React.createContext<CurrencyContextType>({
    currency: currencies[0],
    setCurrency: () => { },
    convertPrice: (price) => `Rs ${price.toLocaleString()}`
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = React.useState(currencies[0])
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('currency')
        if (saved) {
            const found = currencies.find(c => c.code === saved)
            if (found) setCurrencyState(found)
        }
    }, [])

    function setCurrency(curr: typeof currencies[0]) {
        setCurrencyState(curr)
        localStorage.setItem('currency', curr.code)
    }

    function convertPrice(price: number): string {
        const converted = price * currency.rate
        return `${currency.symbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }

    if (!mounted) {
        return <>{children}</>
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export const useCurrency = () => React.useContext(CurrencyContext)

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency()
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2 text-sm font-medium"
            >
                {currency.symbol} {currency.code}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                        {currencies.map((curr) => (
                            <button
                                key={curr.code}
                                onClick={() => {
                                    setCurrency(curr)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${currency.code === curr.code
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <span>{curr.name}</span>
                                <span className="font-bold">{curr.symbol}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
