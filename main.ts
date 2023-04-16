// Control variables
const seedString = "chronicles of empire and exile"
const numSimulations = 1000

// Typescript Types
interface NumberIndexedObject {
    [key: number]: number;
}


//Random number generator
//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}
function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}
// Create cyrb128 state:
var seed = cyrb128(seedString);
// Four 32-bit component hashes provide the seed for sfc32.
var rand = sfc32(seed[0], seed[1], seed[2], seed[3]); // Call rand() to generate a random number

class Campaign {
    // Class for simulating a dice and compiling the results of the simulation
    // Attack properties
    attackDice: number // Number of attach die rolled
    halfSwordFaces: number // 3 of 6 faces
    fullSwordFaces: number // 2 of 6 faces
    skullFaces: number // 1 of 6 faces
    swords: number
    // Defense properties
    defenseDice: number // Number of defense die rolled
    blankFaces: number // 2 of 6 faces
    oneShieldFaces: number // 2 of 6 faces
    twoShieldFaces: number // 1 of 6 faces
    doubleFaces: number // 1 of 6 faces
    shields: number
    // Comparison properties
    netSwords: number

    constructor(attackDice: number, defenseDice: number) {
        // Create a rolling simulation for oath board game with the specified number of attack die & defense die
        // Initialize properties
        // Attack properties
        this.attackDice = 0
        this.halfSwordFaces = 0
        this.fullSwordFaces = 0
        this.skullFaces = 0
        this.swords = 0
        // Defense properties
        this.defenseDice = 0
        this.blankFaces = 0
        this.oneShieldFaces = 0
        this.twoShieldFaces = 0
        this.doubleFaces = 0
        this.shields = 0
        // Cumulative properties
        this.netSwords = 0
        // ROLL the dice
        for (let i = 0; i < attackDice; i++) {
            this.rollAttack()
        }
        for (let i = 0; i < defenseDice; i++) {
            this.rollDefense()
        }
    }
    rollAttack() {
        // Roll an attack die from oath and add to the roll results
        this.attackDice += 1
        let r = rand() * 6
        if (r < 3) {
            // Half sword face
            this.halfSwordFaces += 1
        } else if (r < 5) {
            // Full sword face
            this.fullSwordFaces += 1
        } else {
            // skull face
            this.skullFaces += 1
        }
        // Calculate the current attack
        this.swords = this.fullSwordFaces + Math.floor(this.halfSwordFaces / 2) + 2 * this.skullFaces
        this.netSwords = this.swords - this.shields
    }
    rollDefense() {
        // Roll an defense die from oath and add to the roll results
        this.defenseDice += 1
        let r = rand() * 6
        if (r < 2) {
            // blank face
            this.blankFaces += 1
        } else if (r < 4) {
            // one shield face
            this.oneShieldFaces += 1
        } else if (r < 5) {
            // two shield face
            this.twoShieldFaces += 1
        } else {
            // double face
            this.doubleFaces += 1
        }
        // Calculate the current defense
        this.shields = (this.oneShieldFaces + 2 * this.twoShieldFaces) * 2 ** (this.doubleFaces)
        this.netSwords = this.swords - this.shields
    }
}

class Simulation {
    // Class for creating simulations of the game state
    netSwordsList: Array<number>
    attackDiceInput: HTMLInputElement
    defenseDiceInput: HTMLInputElement
    numSimulations: number
    // Visual elements
    canvas: HTMLCanvasElement
    chart: any
    config: any

    constructor() {
        //Pull visual elements
        this.canvas = document.getElementById("simulation-results") as HTMLCanvasElement
        // Pull the data from the page and create the simulation updator
        this.netSwordsList = []
        this.numSimulations = numSimulations
        // Setup buttons and numbers
        this.attackDiceInput = document.getElementById("attack-dice-input") as HTMLInputElement
        this.attackDiceInput.onchange = () => {
            this.load()
        }
        this.defenseDiceInput = document.getElementById("defense-dice-input") as HTMLInputElement
        this.defenseDiceInput.onchange = () => {
            this.load()
        }
        // Setup visual options
        this.config = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        type: "linear",
                        // min: 100,
                    }
                }
            },
        };
        // Load the chart with no data
        this.chart = new Chart(this.canvas, this.config) //NEEDED TO INSTALL THE TYPES FOR CHART.JS
        //Load the initial data
        this.load()
    }
    load() {
        // Re-run the simulation for the current inputs and update the graphics
        this.netSwordsList = []
        for (let i = 0; i < this.numSimulations; i++) {
            let campaign = new Campaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value))
            this.netSwordsList.push(campaign.netSwords)
        }
        // Calculate frequency of each value in the dataset
        const frequencies = this.netSwordsList.reduce((freq: NumberIndexedObject, value: number) => {
            freq[value] = (freq[value] || 0) + 1;
            return freq;
        }, {});
        // Convert the frequencies object into arrays of keys and values
        let labels = Object.keys(frequencies);
        let values = labels.map((key: any) => frequencies[parseInt(key)]);
        // Normalize the values
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        values = values.map(count => count / sum);
        console.log(labels, values)
        // Add a secondary axis
        // Load the scenario into the chat & display
        this.config.data.labels = labels
        this.config.data.datasets = [{
            label: "Data One",
            data: values,
            backgroundColor: "#6495ed",
        }];
        this.chart.update()
        console.log(this)
    }


}

new Simulation()
