import React, { useState } from 'react';

const Mine = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log(searchTerm);
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                />
                <button type="submit" className="btn">Search</button>
            </form>
        </div>
    );
}

export default Mine;