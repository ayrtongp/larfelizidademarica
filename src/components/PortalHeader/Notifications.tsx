import { useRouter } from 'next/router'
import React from 'react'
import { FaBell } from 'react-icons/fa'

const Notifications = ({ count }: any) => {

    const router = useRouter();

    const handleNotifications = () => {
        router.push('/portal/comunicados')
    }

    return (
        <div className="relative cursor-pointer" onClick={handleNotifications}>
            <FaBell size={30} color='gray' />
            {count > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center align-middle text-xs">
                    {count}
                </div>
            )}
        </div>
    )
}

export default Notifications