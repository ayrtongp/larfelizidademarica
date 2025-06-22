import React, { useState } from "react";

const QuantityInput = () => {
    const [quantity, setQuantity] = useState("");

    const handleIncrease = () => {
        setQuantity((prevQuantity) => {
            if (quantity != '') {
                const num = parseFloat(prevQuantity.replace(",", "."));
                return (num + 1).toString().replace(".", ",");
            }
            else {
                return (1).toString();
            }
        });
    };

    const handleDecrease = () => {
        setQuantity((prevQuantity) => {
            if (quantity != '') {
                const num = parseFloat(prevQuantity.replace(",", "."));
                return (num - 1).toString().replace(".", ",");
            }
            else {
                return (-1).toString();
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const pattern = /^-?\d*(,\d*)?$/;
        if (pattern.test(value)) {
            setQuantity(value.toString().replace(".", ","));
        }
    };

    return (

        <div className="p-4 bg-gray-50 rounded-lg shadow-md w-full">
            <div className="flex items-center justify-center space-x-4">
                <button onClick={handleDecrease}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                    -
                </button>
                <input type="text" value={quantity} onChange={handleInputChange}
                    className="w-30 text-center border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <button onClick={handleIncrease}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                    +
                </button>
            </div>
        </div>
    );
};

export default QuantityInput;
