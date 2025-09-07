class MockBlockchain {
    constructor() {
        this.chain = JSON.parse(localStorage.getItem('blockchainIDs')) || [];
    }

    register(data) {
        const id = this.generateID(data);
        const block = {
            id: id,
            data: data,
            timestamp: Date.now(),
            previousHash: this.chain.length > 0 ? this.chain[this.chain.length - 1].id : '0'
        };
        this.chain.push(block);
        localStorage.setItem('blockchainIDs', JSON.stringify(this.chain));
        return id;
    }

    getUserID() {
        const chain = JSON.parse(localStorage.getItem('blockchainIDs')) || [];
        return chain.length > 0 ? chain[chain.length - 1].id : null;
    }

    verifyID(id) {
        const chain = JSON.parse(localStorage.getItem('blockchainIDs')) || [];
        return chain.some(block => block.id === id);
    }

    generateID(data) {
        // Simple hash simulation
        const str = JSON.stringify(data) + Date.now();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).slice(0, 10);
    }
}

const blockchain = new MockBlockchain();
