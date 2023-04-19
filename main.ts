// Control variables
const seedString = "chronicles of empire and exile"
const numSimulations = 1000
const htmlIDs = {
    attackInput: "attack-dice-input",
    defenseInput: "defense-dice-input",
    rollButton: "roll-dice",
    rollArea: "roll-area",
    simulationArea: "simulation-results",
    skullArea: "skull-results"
}
// Test HTML IDs
for (let key in htmlIDs) {
    if (document.getElementById(key) === undefined) {
        throw "HTML ID not found: " + key
    }
}

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

class SimplifiedCampaign {
    // Class for simulating a dice and compiling the results of the simulation
    // Simplified because it does not include information on the number of warbands for attacker & defender
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
    netWarbands: number // Some warbands will inherently be killed while attacking

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
        this.netWarbands = 0
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
        this.netWarbands = this.netSwords - this.skullFaces
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
        this.netWarbands = this.netSwords - this.skullFaces
    }
}

class FullCampaign extends SimplifiedCampaign {
    // Full campaign also includes information on the number of warbands held by attacker & defender
    attackWarbands: number
    defenseWarbands: number
    winner: "Attack" | "Defense" //Winner is Attacker if they have enough warbands that can be sacraficed
    attackSacrafices: number //0 if no attack sacrafices are required for victory, otherwise a number

    constructor(attackDice: number, defenseDice: number, attackWarbands: number, defenseWarbands:number) {
        // Like Campaign, but show who the winner & loser are based on number of warbands for each
        super(attackDice, defenseDice)
        this.attackWarbands = attackWarbands
        this.defenseWarbands = defenseWarbands
        this.attackSacrafices = 0
        // Calculate winner and associated properties
        if (this.netSwords > 0) {
            this.winner = "Attack"
        } else if (this.netSwords + this.attackWarbands - this.skullFaces > 0) {
            this.winner = "Attack"
            this.attackSacrafices = -1 * this.netSwords
        } else {
            this.winner = "Defense"
        }
    }
}

class Histogram {
    // Visual elements
    canvas: HTMLCanvasElement // HTML Canvas element for holding the chart
    chart: any
    config: any
    dropLinePoints: Array<number> // Points at which the visual should drop lines on the CFD graph
    bounds: [number | undefined, number | undefined]

    constructor(canvasID: string, dropLinePoints: Array<number>, enforcedBounds: [number | undefined, number | undefined]) {
        // Histogram canvas object
        // Histogram list - array of number that should be histogramed
        // CanvasID - ID of html canvas element to draw on
        // dropLinePoints - Array of numbers between 0 and 1 to drop lines on the canvas
        // enforced bounds - furthest out bounds that will be shown in the histogram, undefined if all allowed 
        //.load() must be calld to display actual data

        //Pull visual elements
        this.canvas = document.getElementById(canvasID) as HTMLCanvasElement
        // Define the drop line points
        this.dropLinePoints = dropLinePoints
        this.bounds = enforcedBounds
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
                    legend: {
                        labels: {
                            filter: (item: any, chart: any) => {
                                // Logic to remove a particular legend item goes here
                                return !item.text.includes('Guide');
                            }
                        }
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                    },
                    y: {
                        type: "linear",
                        position: "left",
                        display: false,
                    },
                    y2: {
                        type: "linear",
                        position: "left",
                        min: 0,
                        max: 1,
                    }
                }
            },
        };
        // Load the chart with no data
        this.chart = new Chart(this.canvas, this.config) //NEED TO INSTALL THE TYPES FOR CHART.JS
    }
    load(histogramList: Array<number>) {
        // Load data into the histogram canvas and display
        // Calculate frequency of each value in the dataset
        const frequencies = histogramList.reduce((freq: NumberIndexedObject, value: number) => {
            freq[value] = (freq[value] || 0) + 1 / histogramList.length;
            return freq;
        }, {});
        // Frequency labels
        let freqSortedLabels: Array<number> = []
        for (let key in frequencies) {
            freqSortedLabels.push(parseInt(key))
        }
        freqSortedLabels.sort((a, b) => a - b)
        // Calculate cumulative values
        let cumulativeValuesSorted = []
        let cumulativeSum = 0
        for (let key of freqSortedLabels) {
            cumulativeSum += frequencies[key]
            cumulativeValuesSorted.push(cumulativeSum)
        }
        // Load graph labels
        this.config.data.labels = freqSortedLabels
        // Set x axis minimum and maxiumum
        this.config.options.scales.x.min = Math.max(this.bounds[0] ?? -1 * 10 ** 10, freqSortedLabels[0])
        this.config.options.scales.x.max = Math.min(this.bounds[1] ?? 10 ** 10, freqSortedLabels[freqSortedLabels.length - 1])
        if (this.config.options.scales.x.min >= this.config.options.scales.x.max) {
            this.config.options.scales.x.min = freqSortedLabels[0]
            this.config.options.scales.x.max = freqSortedLabels[freqSortedLabels.length - 1]
        }
        // Load the probability distribution
        this.config.data.datasets = [
            { // probability distribution
                label: "Distribution",
                data: freqSortedLabels.map(x => frequencies[x]),
                backgroundColor: "#6495ed",
                order: 1,
            },
            { // Cunulative distribution
                label: "Cumulative",
                data: cumulativeValuesSorted,
                borderColor: "#0000ff",
                backgroundColor: "#0000ff",
                yAxisID: "y2",
                type: "line",
                order: 0,
            },
        ];
        // Function for interpolating points along the CDF
        function interpolateX(yTarget: number, xValues: Array<number>, yValues: Array<number>): number {
            // Find the x value interpolated between x and y values in a set of values
            // xValues & yValues must be in order for smallest to largest
            let xTarget: number | undefined = undefined
            for (let i = 1; i < freqSortedLabels.length; i++) {
                if (yTarget >= yValues[i - 1] && yTarget <= yValues[i]) {
                    xTarget = (yTarget - yValues[i - 1]) / (yValues[i] - yValues[i - 1]) * (xValues[i] - xValues[i - 1]) + xValues[i - 1]
                    break
                }
            }
            if (yTarget < yValues[0]) {
                xTarget = -1 * 10 ** 10
            } else if (xTarget === undefined) {
                xTarget = 10 ** 10
            }
            return xTarget
        }
        // Interpolate points of interest
        for (let yTarget of this.dropLinePoints) {
            let xTarget = interpolateX(yTarget, freqSortedLabels, cumulativeValuesSorted)
            this.config.data.datasets.push({
                label: "Guide",
                data: [{ x: xTarget, y: 0 }, { x: xTarget, y: yTarget }],
                borderColor: "#dc143c",
                backgroundColor: "#dc143c",
                pointRadius: 4,
                type: "line",
                yAxisID: "y2",
                order: -1,
            })
        }
        // Update the chart
        this.chart.update()
    }
}

class Simulation {
    // Class for creating simulations of the game state
    attackDiceInput: HTMLInputElement
    defenseDiceInput: HTMLInputElement
    numSimulations: number
    // Setup histograms for calculated properties
    deltaHistogram: Histogram
    skullsHistogram: Histogram

    constructor(numSimulations: number) {
        // Setup base properties
        this.numSimulations = numSimulations
        this.deltaHistogram = new Histogram(htmlIDs.simulationArea, [0.2, 0.5, 0.8], [-100, 100])
        this.skullsHistogram = new Histogram(htmlIDs.skullArea, [0.2, 0.5, 0.8], [undefined, undefined])
        // Setup buttons and numbers
        this.attackDiceInput = document.getElementById(htmlIDs.attackInput) as HTMLInputElement
        this.defenseDiceInput = document.getElementById(htmlIDs.defenseInput) as HTMLInputElement
        // Load the histograms
        this.load()
    }
    load() {
        // Re-run the simulation for the current inputs and update the graphics
        let netSwords = []
        let skulls = []
        for (let i = 0; i < this.numSimulations; i++) {
            let campaign = new SimplifiedCampaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value))
            netSwords.push(campaign.netSwords) // Net swords, positive is more swords
            skulls.push(Math.floor(campaign.skullFaces)) // Skulls shown on dice
        }
        // Update the two histograms
        this.deltaHistogram.load(netSwords)
        this.skullsHistogram.load(skulls)

    }
}

class Roller {
    // Class for simulating dice rolls and displaying to the
    attackDiceInput: HTMLInputElement
    defenseDiceInput: HTMLInputElement

    constructor() {
        this.attackDiceInput = document.getElementById(htmlIDs.attackInput) as HTMLInputElement
        this.defenseDiceInput = document.getElementById(htmlIDs.defenseInput) as HTMLInputElement
    }
    clear() {
        let areaDiv = document.getElementById(htmlIDs.rollArea) as HTMLDivElement
        areaDiv.innerHTML = ""
    }
    roll() {
        // Animate a simulated rolling of the dice
        let campaign = new SimplifiedCampaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value))
        const attributeIconPairs: Array<[number, string]> = [
            [campaign.skullFaces, "skullSword.png"],
            [campaign.fullSwordFaces, "oneSword.png"],
            [campaign.halfSwordFaces, "halfSword.png"],
            [campaign.doubleFaces, "doubleShield.png"],
            [campaign.twoShieldFaces, "twoShield.png"],
            [campaign.oneShieldFaces, "oneShield.png"],
            [campaign.blankFaces, "blankShield.png"]
        ]
        // Get the area where we are going to put the roller
        let areaDiv = document.getElementById(htmlIDs.rollArea) as HTMLDivElement
        areaDiv.innerHTML = ""
        // Add the appropriate images
        for (let iconPair of attributeIconPairs) {
            for (let i = 0; i < iconPair[0]; i++) {
                let diceFace = document.createElement("img")
                diceFace.src = "./icons/" + iconPair[1]
                diceFace.classList.add("dice-face")
                areaDiv.appendChild(diceFace)
            }
        }
        // Add text to help the player understand the result
        let explanationText = document.createElement("p")
        areaDiv.appendChild(explanationText)
        explanationText.innerHTML = `
        Swords: ${campaign.swords}, 
        Skulls: ${campaign.skullFaces},
        Shields: ${campaign.shields},
        Net Swords: ${campaign.netSwords} <br>
        Winner: 
        `
    }
}


let simulation = new Simulation(numSimulations)
let roller = new Roller()
roller.roll()

document.getElementById(htmlIDs.attackInput)!.onchange = () => {
    simulation.load()
    roller.clear()
}

document.getElementById(htmlIDs.defenseInput)!.onchange = () => {
    simulation.load()
    roller.clear()
}

document.getElementById(htmlIDs.rollButton)!.onclick = () => {
    roller.roll()
}