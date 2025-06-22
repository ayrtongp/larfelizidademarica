import React from 'react'

interface Props {
    rankingList: Item[];
    rankingName: string
}

interface Item {
    position: string;
    imageSrc: string;
    name: string;
    pointsValue: string;
    pointsName: string;
}

const RankingList = ({ rankingList, rankingName }: Props) => {
    return (
        <div>
            <div className="bg-white shadow-md rounded-md overflow-hidden max-w-lg mx-auto mt-16">
                <div className="bg-gray-100 py-2 px-4">
                    <h2 className="text-xl font-semibold text-gray-800">{rankingName}</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                    {rankingList.length > 0 && rankingList.map((item: Item, index: number) => {

                        return (
                            <li key={index} className="flex items-center py-4 px-6">
                                <span className="text-gray-700 text-lg font-medium mr-4">{item.position}</span>
                                <img className="w-12 h-12 rounded-full object-cover mr-4" src={item.imageSrc} alt="User avatar" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-800">{item.name}</h3>
                                    <p className="text-gray-600 text-base">{item.pointsValue} {item.pointsName}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default RankingList