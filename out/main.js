"use strict";
var _a;
// Control variables
const seedString = "chronicles of empire and exile";
const numSimulations = 1000;
const htmlIDs = {
    // simulation inputs
    inputArea: "input-area",
    templateTriple: "input-triple",
    templateInput: "input-text",
    templateUp: "input-up",
    templateDown: "input-down",
    templateImage: "input-image",
    // Other areas and buttons
    rollButton: "roll-dice",
    rollArea: "roll-area",
    simulationArea: "simulation-results",
    skullArea: "skull-results",
    allSimulationArea: "simulation-results-area",
    toggleSimulations: "toggle-simulations"
};
// Test HTML IDs
for (const [key, value] of Object.entries(htmlIDs)) {
    if (document.getElementById(value) === null) {
        throw "HTML ID not found: " + key + " | " + value;
    }
}
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
let rand = sfc32(seed[0], seed[1], seed[2], seed[3]); // Call rand() to generate a random number
//OVERRIDE RANDOM
rand = () => Math.random();
class SimplifiedCampaign {
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
        for (let i = 0; i < (attackDice | 0); i++) {
            this.rollAttack();
        }
        for (let i = 0; i < (defenseDice | 0); i++) {
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
class FullCampaign extends SimplifiedCampaign {
    constructor(attackDice, defenseDice, attackWarbands, defenseWarbands) {
        // Like Campaign, but show who the winner & loser are based on number of warbands for each
        super(attackDice, defenseDice);
        this.attackWarbands = attackWarbands | 0;
        this.defenseWarbands = defenseWarbands | 0;
        this.attackSacrafices = 0;
        this.netAttack = this.netSwords - this.defenseWarbands;
        // Calculate winner and associated properties
        if (this.netAttack > 0) {
            this.winner = "Attack";
        }
        else if (this.netAttack + this.attackWarbands - this.skullFaces > 0) {
            this.winner = "Attack";
            this.attackSacrafices = -1 * this.netAttack + 1;
        }
        else {
            this.winner = "Defense";
        }
    }
}
class Histogram {
    constructor(canvasID, dropLinePoints, enforcedBounds) {
        // Histogram canvas object
        // Histogram list - array of number that should be histogramed
        // CanvasID - ID of html canvas element to draw on
        // dropLinePoints - Array of numbers between 0 and 1 to drop lines on the canvas
        // enforced bounds - furthest out bounds that will be shown in the histogram, undefined if all allowed 
        //.load() must be calld to display actual data
        //Pull visual elements
        this.canvas = document.getElementById(canvasID);
        // Define the drop line points
        this.dropLinePoints = dropLinePoints;
        this.bounds = enforcedBounds;
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
        this.chart = new Chart(this.canvas, this.config); //NEED TO INSTALL THE TYPES FOR CHART.JS
    }
    load(histogramList) {
        var _a, _b;
        // Load data into the histogram canvas and display
        // Calculate frequency of each value in the dataset
        const frequencies = histogramList.reduce((freq, value) => {
            freq[value] = (freq[value] || 0) + 1 / histogramList.length;
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
        this.config.options.scales.x.min = Math.max((_a = this.bounds[0]) !== null && _a !== void 0 ? _a : -1 * 10 ** 10, freqSortedLabels[0]);
        this.config.options.scales.x.max = Math.min((_b = this.bounds[1]) !== null && _b !== void 0 ? _b : 10 ** 10, freqSortedLabels[freqSortedLabels.length - 1]);
        if (this.config.options.scales.x.min >= this.config.options.scales.x.max) {
            this.config.options.scales.x.min = freqSortedLabels[0];
            this.config.options.scales.x.max = freqSortedLabels[freqSortedLabels.length - 1];
        }
        // Load the probability distribution
        this.config.data.datasets = [
            {
                label: "Distribution",
                data: freqSortedLabels.map(x => frequencies[x]),
                backgroundColor: "#6495ed",
                order: 1,
            },
            {
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
        for (let yTarget of this.dropLinePoints) {
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
    }
}
class Simulation {
    constructor(numSimulations) {
        // Setup base properties
        this.numSimulations = numSimulations;
        this.deltaHistogram = new Histogram(htmlIDs.simulationArea, [0.2, 0.5, 0.8], [-50, 50]);
        this.skullsHistogram = new Histogram(htmlIDs.skullArea, [0.2, 0.5, 0.8], [undefined, undefined]);
        // Setup buttons and numbers
        this.attackDiceInput = document.getElementById("attack-dice-" + htmlIDs.templateInput);
        this.defenseDiceInput = document.getElementById("defense-dice-" + htmlIDs.templateInput);
        // Load the histograms
        this.load();
    }
    load() {
        // Re-run the simulation for the current inputs and update the graphics
        let netSwords = [];
        let skulls = [];
        for (let i = 0; i < this.numSimulations; i++) {
            let campaign = new SimplifiedCampaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value));
            netSwords.push(campaign.netSwords); // Net swords, positive is more swords
            skulls.push(Math.floor(campaign.skullFaces)); // Skulls shown on dice
        }
        // Update the two histograms
        this.deltaHistogram.load(netSwords);
        this.skullsHistogram.load(skulls);
    }
}
class Roller {
    constructor() {
        this.attackDiceInput = document.getElementById("attack-dice-" + htmlIDs.templateInput);
        this.defenseDiceInput = document.getElementById("defense-dice-" + htmlIDs.templateInput);
        this.attackWarbandsInput = document.getElementById("attack-warbands-" + htmlIDs.templateInput);
        this.defenseWarbandsInput = document.getElementById("defense-warbands-" + htmlIDs.templateInput);
    }
    clear() {
        let areaDiv = document.getElementById(htmlIDs.rollArea);
        areaDiv.innerHTML = "";
    }
    roll() {
        // Animate a simulated rolling of the dice
        let campaign = new FullCampaign(parseInt(this.attackDiceInput.value), parseInt(this.defenseDiceInput.value), parseInt(this.attackWarbandsInput.value), parseInt(this.defenseWarbandsInput.value));
        const attributeIconPairs = [
            [campaign.skullFaces, "skullSword.png"],
            [campaign.fullSwordFaces, "oneSword.png"],
            [campaign.halfSwordFaces, "halfSword.png"],
            [campaign.doubleFaces, "doubleShield.png"],
            [campaign.twoShieldFaces, "twoShield.png"],
            [campaign.oneShieldFaces, "oneShield.png"],
            [campaign.blankFaces, "blankShield.png"]
        ];
        // Get the area where we are going to put the roller
        let areaDiv = document.getElementById(htmlIDs.rollArea);
        areaDiv.innerHTML = "";
        // Add the appropriate images
        for (let iconPair of attributeIconPairs) {
            for (let i = 0; i < iconPair[0]; i++) {
                let diceFace = document.createElement("img");
                diceFace.src = "./icons/" + iconPair[1];
                diceFace.classList.add("dice-face");
                areaDiv.appendChild(diceFace);
            }
        }
        // Add text to help the player understand the result
        let explanationText = document.createElement("p");
        areaDiv.appendChild(explanationText);
        let sacraficeText = campaign.attackSacrafices > 0 ? `(with ${campaign.attackSacrafices} sacrafice)` : "";
        explanationText.innerHTML = `
        Skulls: ${campaign.skullFaces},
        Swords: ${campaign.swords}, 
        Shields: ${campaign.shields}, <br>
        Net Attack: ${campaign.netAttack} <br>
        Winner: ${campaign.winner} ${sacraficeText}
        `;
    }
}
document.getElementById(htmlIDs.toggleSimulations).onclick = () => {
    let simulationDiv = document.getElementById(htmlIDs.allSimulationArea);
    if (simulationDiv.style.display === "none") {
        simulationDiv.style.display = "block";
    }
    else {
        simulationDiv.style.display = "none";
    }
};
const idPrefixesAndImageNames = [
    // [id prefix, icon name, starting value]
    ["attack-dice", "blankSword", 5],
    ["attack-warbands", "meepleAttack", 0],
    ["defense-dice", "blankShield", 2],
    ["defense-warbands", "meepleDefense", 0]
];
let inputArea = document.getElementById(htmlIDs.inputArea);
for (let L of idPrefixesAndImageNames) {
    let idPrefix = L[0];
    let iconName = L[1];
    let startingValue = L[2];
    // Copy the template inputTriple
    let inputTriple = (_a = document.getElementById(htmlIDs.templateTriple)) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
    inputArea.appendChild(inputTriple);
    // Generate a unique ID for the copied element
    inputTriple.setAttribute('id', idPrefix + htmlIDs.templateInput);
    // Modify the IDs of the copied element's descendants
    const descendantElements = inputTriple.querySelectorAll('[id]');
    descendantElements.forEach((element) => {
        element.setAttribute('id', idPrefix + '-' + element.getAttribute('id'));
    });
    //Change center icon
    let centerImage = document.getElementById(idPrefix + "-" + htmlIDs.templateImage);
    centerImage.src = "./icons/" + iconName + ".png";
    //Change stating number & set actions
    let textInput = document.getElementById(idPrefix + "-" + htmlIDs.templateInput);
    textInput.value = startingValue.toString();
}
// Create main elements
let simulation = new Simulation(numSimulations);
let roller = new Roller();
// Set all the actions for the inputs & buttons
for (let L of idPrefixesAndImageNames) {
    let idPrefix = L[0];
    // Take the value of the input modidied by the delta and set as the new value
    let textInput = document.getElementById(idPrefix + "-" + htmlIDs.templateInput);
    //     Function to sanatize inputs and set values
    let setNewValue = (delta) => {
        // Get new value as an integer
        let valueInt = parseInt(textInput.value) + delta;
        if (valueInt < 0) {
            valueInt = 0;
        }
        else if (valueInt > 99) {
            valueInt = 99;
        }
        else if (!(valueInt >= 0 && valueInt <= 99)) {
            valueInt = 0;
        }
        // Set back the value
        textInput.value = valueInt.toString();
        // Reload everything required
        simulation.load();
        roller.clear();
    };
    textInput.oninput = () => { setNewValue(0); };
    //Up arrow and set action
    document.getElementById(idPrefix + "-" + htmlIDs.templateUp).onclick = () => { setNewValue(1); };
    //Down arrow and set action
    document.getElementById(idPrefix + "-" + htmlIDs.templateDown).onclick = () => { setNewValue(-1); };
}
// Create the roll dice button
document.getElementById(htmlIDs.rollButton).onclick = () => {
    roller.roll();
};
//# sourceMappingURL=main.js.map