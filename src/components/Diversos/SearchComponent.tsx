import { useState } from "react";
import { FaSearch } from "react-icons/fa";

interface ListObject {
    id: number;
    label: string;
}

interface Props {
    listObjects: ListObject[];
}

const SearchComponent = ({ listObjects }: Props) => {
    const [query, setQuery] = useState("");
    const [filteredFruits, setFilteredFruits] = useState(listObjects);
    const [isFocused, setIsFocused] = useState(false);
    const [valueSelected, setValueSelected] = useState({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setFilteredFruits(
            listObjects.filter((object: ListObject) =>
                object.label.toLowerCase().includes(value.toLowerCase()),
            ),
        );
    };

    const handleClick = (object: any) => {
        setValueSelected(object)
        setQuery(object.label)
    }

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setTimeout(() => setIsFocused(false), 200);
    };

    return (
        <div className="relative w-80">
            <div className="flex items-center border rounded-lg px-2 py-1">
                <FaSearch />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Pesquisar..."
                    className="ml-2 flex-1 outline-none bg-transparent"
                />
            </div>
            {isFocused && filteredFruits.length > 0 && (
                <ul className="absolute z-10 bg-white border mt-1 max-h-48 overflow-y-auto w-full rounded-lg shadow-lg">
                    {filteredFruits.map((object) => (
                        <li key={object.id} onClick={() => handleClick(object)} className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                            {object.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchComponent;
