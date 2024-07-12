import React from 'react'

interface Props {
    title: string;
    itemList: Item[];
    bannerColor?: string
}

interface Item {
    value: string;
    description: string;
}



const StatsBanner = ({ title, itemList, bannerColor = 'bg-[#FF6347]' }: Props) => {
    return (
        <div className="py-10 px-5">
            <div className={`max-w-5xl rounded-xl ${bannerColor} dark:bg-[#4B5563] mx-auto flex flex-col sm:flex-row items-center justify-between md:px-10 gap-x-10 py-10 px-5 lg:px-10 gap-y-5`}>
                <div className="flex flex-col items-center justify-center gap-y-3">
                    <h2 className="text-center sm:text-left text-3xl text-white dark:text-gray-200 font-bold">{title}</h2>
                </div>
                {itemList.length > 0 && itemList.map((item: Item, index: number) => {
                    return (
                        <div key={index} className="flex flex-col items-center justify-center gap-y-3">
                            <h2 className="text-3xl lg:text-5xl text-white dark:text-gray-200 font-bold">{item.value}</h2>
                            <p className="text-center text-sm md:text-base text-white dark:text-gray-400">{item.description}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default StatsBanner