import React from 'react'

const GoogleLikeInput = () => {
    return (
        <div className="bg-white p-4 rounded-lg">
            <div className="relative bg-inherit">
                <input type="text" id="username" name="username" placeholder="Type inside me"
                    className="peer bg-transparent h-10 w-72 rounded-lg text-gray-200 placeholder-transparent ring-2 px-2 ring-gray-500 focus:ring-sky-600 focus:outline-none focus:border-rose-600" />
                <label htmlFor="username" className="absolute cursor-text left-0 -top-3 text-sm text-gray-500 bg-inherit mx-1 px-1 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2 peer-focus:-top-3 peer-focus:text-sky-600 peer-focus:text-sm transition-all">Type inside me</label>
            </div>
        </div>
    )
}

export default GoogleLikeInput