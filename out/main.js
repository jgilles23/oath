"use strict";
// Control variables
const seedString = "chronicles of empire and exile";
const numSimulations = 1000;
//Random number generator
//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
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
function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    };
}
// Create cyrb128 state:
var seed = cyrb128(seedString);
// Four 32-bit component hashes provide the seed for sfc32.
var rand = sfc32(seed[0], seed[1], seed[2], seed[3]); // Call rand() to generate a random number
class Campaign {
    constructor(attackDice, defenseDice) {
        // Create a rolling simulation for oath board game with the specified number of attack die & defense die
        // Initialize properties
        // Attack properties
        this.attackDice = 0;
        this.halfSwordFaces = 0;
        this.fullSwordFaces = 0;
        this.skullFaces = 0;
        this.swords = 0;
        // Defense properties
        this.defenseDice = 0;
        this.blankFaces = 0;
        this.oneShieldFaces = 0;
        this.twoShieldFaces = 0;
        this.doubleFaces = 0;
        this.shields = 0;
        // Cumulative properties
        this.netSwords = 0;
        this.netWarbands = 0;
        // ROLL the dice
        for (let i = 0; i < attackDice; i++) {
            this.rollAttack();
        }
        for (let i = 0; i < defenseDice; i++) {
            this.rollDefense();
        }
    }
    rollAttack() {
        // Roll an attack die from oath and add to the roll results
        this.attackDice += 1;
        let r = rand() * 6;
        if (r < 3) {
            // Half sword face
            this.halfSwordFaces += 1;
        }
        else if (r < 5) {
            // Full sword face
            this.fullSwordFaces += 1;
        }
        else {
            // skull face
            this.skullFaces += 1;
        }
        // Calculate the current attack
        this.swords = this.fullSwordFaces + Math.floor(this.halfSwordFaces / 2) + 2 * this.skullFaces;
        this.netSwords = this.swords - this.shields;
        this.netWarbands = this.netSwords - this.skullFaces;
    }
    rollDefense() {
        // Roll an defense die from oath and add to the roll results
        this.defenseDice += 1;
        let r = rand() * 6;
        if (r < 2) {
            // blank face
            this.blankFaces += 1;
        }
        else if (r < 4) {
            // one shield face
            this.oneShieldFaces += 1;
        }
        else if (r < 5) {
            // two shield face
            this.twoShieldFaces += 1;
        }
        else {
            // double face
            this.doubleFaces += 1;
        }
        // Calculate the current defense
        this.shields = (this.oneShieldFaces + 2 * this.twoShieldFaces) * 2 ** (this.doubleFaces);
        this.netSwords = this.swords - this.shields;
        this.netWarbands = this.netSwords - this.skullFaces;
    }
}
class Simulation {
    constructor() {
        //Pull visual elements
        this.canvas = document.getElementById("simulation-results");
        // Pull the data from the page and create the simulation updator
        this.histogramList = [];
        this.numSimulations = numSimulations;
        // Setup buttons and numbers
        this.attackDiceInput = document.getElementById("attack-dice-input");
        this.attackDiceInput.onchange = () => {
            this.load();
        };
        this.defenseDiceInput = document.getElementById("defense-dice-input");
        this.defenseDiceInput.onchange = () => {
            this.load();
        };
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
                            filter: (item, chart) => {
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
        this.chart = new Chart(this.canvas, this.config); //NEEDED TO INSTALL THE TYPES FOR CHART.JS
        //Load the initial data
        this.load();
    }
    load() {
        // Re-run the simulation for the current inputs and update the graphics
        this.histogramList = [];
        for (let i = 0; i < this.numSimulations; i++) {
            let campaign = new Campaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value));
            this.histogramList.push(campaign.netSwords); // SHOW NET WARBANDS OVERCOME OR LOST
        }
        // Calculate frequency of each value in the dataset
        const frequencies = this.histogramList.reduce((freq, value) => {
            freq[value] = (freq[value] || 0) + 1 / this.numSimulations;
            return freq;
        }, {});
        // Frequency labels
        let freqSortedLabels = [];
        for (let key in frequencies) {
            freqSortedLabels.push(parseInt(key));
        }
        freqSortedLabels.sort((a, b) => a - b);
        // Calculate cumulative values
        let cumulativeValuesSorted = [];
        let cumulativeSum = 0;
        for (let key of freqSortedLabels) {
            cumulativeSum += frequencies[key];
            cumulativeValuesSorted.push(cumulativeSum);
        }
        // Load graph labels
        this.config.data.labels = freqSortedLabels;
        // Set x axis minimum and maxiumum
        this.config.options.scales.x.min = Math.max(-20, freqSortedLabels[0]);
        this.config.options.scales.x.max = Math.min(20, freqSortedLabels[freqSortedLabels.length - 1]);
        if (this.config.options.scales.x.min >= this.config.options.scales.x.max) {
            this.config.options.scales.x.min = freqSortedLabels[0];
            this.config.options.scales.x.max = freqSortedLabels[freqSortedLabels.length - 1];
        }
        // Load the probability distribution
        this.config.data.datasets = [
            {
                label: "Probability Distribution",
                data: freqSortedLabels.map(x => frequencies[x]),
                backgroundColor: "#6495ed",
                order: 1,
            },
            {
                label: "Cumulative Distribution",
                data: cumulativeValuesSorted,
                borderColor: "#0000ff",
                backgroundColor: "#0000ff",
                yAxisID: "y2",
                type: "line",
                order: 0,
            },
        ];
        // Function for interpolating points along the CDF
        function interpolateX(yTarget, xValues, yValues) {
            // Find the x value interpolated between x and y values in a set of values
            // xValues & yValues must be in order for smallest to largest
            let xTarget = undefined;
            for (let i = 1; i < freqSortedLabels.length; i++) {
                if (yTarget >= yValues[i - 1] && yTarget <= yValues[i]) {
                    xTarget = (yTarget - yValues[i - 1]) / (yValues[i] - yValues[i - 1]) * (xValues[i] - xValues[i - 1]) + xValues[i - 1];
                    break;
                }
            }
            if (yTarget < yValues[0]) {
                xTarget = -1 * 10 ** 10;
            }
            else if (xTarget === undefined) {
                xTarget = 10 ** 10;
            }
            return xTarget;
        }
        // Interpolate points of interest
        for (let yTarget of [0.2, 0.5, 0.8]) {
            let xTarget = interpolateX(yTarget, freqSortedLabels, cumulativeValuesSorted);
            this.config.data.datasets.push({
                label: "Guide",
                data: [{ x: xTarget, y: 0 }, { x: xTarget, y: yTarget }],
                borderColor: "#dc143c",
                backgroundColor: "#dc143c",
                pointRadius: 4,
                type: "line",
                yAxisID: "y2",
                order: -1,
            });
        }
        // Update the chart
        this.chart.update();
        console.log(this);
    }
}
new Simulation();
//# sourceMappingURL=main.js.map