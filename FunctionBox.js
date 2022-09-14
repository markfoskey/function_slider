function FunctionBox(x, y, width, height, fn, imageFilename, imageShift) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fn = fn;
    this.input = 0;
    this.output = 0;
    this.img = new Image();
    try {
        this.img.src = imageFilename;
    } catch {
        this.img = new Image();
    }
    this.imageShift = imageShift;
    this.handleHalfWidth = 0.1 * width;
    this.handleHalfHeight = this.handleHalfWidth;
    this.inHandleX = 0;
    this.inHandleY = 0;
    this.outHandleX = 0;
    this.outHandleY = 0;
    this.isSelected = false;
    this.downstream = null;
    this.inScale = new FunctionScale();
    this.outScale = new FunctionScale();
    this.updateBoxDetails();
}

FunctionBox.prototype.getInput = function () {
    return this.input;
}

FunctionBox.prototype.getOutput = function () {
    return this.output;
}

FunctionBox.prototype.updateOutput = function () {
    if (typeof this.fn === 'function') {
        this.output = this.fn(this.input);
    } else {
        this.output = 0;
    }
    if (this.downstream instanceof FunctionBox) {
        this.downstream.setInput(this.output);
    }
    this.outHandleY = this.outScale.yFromVal(this.output);
}

FunctionBox.prototype.setInput = function (input) {
    this.input = input;
    this.inHandleY = this.inScale.yFromVal(this.input);
    this.updateOutput();
}

FunctionBox.prototype.setInHandleY = function (inHandleY) {
    this.inHandleY = inHandleY;
    this.input = this.inScale.valFromY(inHandleY);
    this.updateOutput();
}

FunctionBox.prototype.setPosition = function (x, y) {
    scaleMargin = 30;
    this.x = x;
    this.y = y;
    inScaleX = this.x + scaleMargin;
    outScaleX = this.x + this.width - scaleMargin
    scaleTopY = this.y + scaleMargin;
    scaleBottomY = this.y + this.height - scaleMargin;
    this.inScale.updateScaleDetails(inScaleX, scaleBottomY, scaleTopY);
    this.outScale.updateScaleDetails(outScaleX, scaleBottomY, scaleTopY);
    this.inHandleX = this.x;
    this.inHandleY = this.inScale.yFromVal(this.input);
    this.outHandleX = this.x + this.width;
    this.outHandleY = this.outScale.yFromVal(this.output);
}

function FunctionScale()
{
    this.minVal = 0; // The min and max numerical values represented
    this.maxVal = 0; 
    this.x = 0; // The x coordinate of the scale line in pixels
    this.yMin = 0; // Min and max y coordinates of the scale in pixels
    this.yMax = 0;
    this.valHeight = 0; // Internal; just maxVal - minVal
    this.pixHeight = 0;
    this.majorTickSpacing = 0; // Separation between major ticks
    this.maxMajorTicks = 8;
    this.ticksPerMajor = 5;
    this.pixelsPerVal = 0;
}

FunctionScale.prototype.yFromVal = function(val)
{
    // Note that this.yMax is the lowest point on the screen, and this.pixelsPerVal is negative
    // so you move towards the top of the screen (decreasing pixel number in y) as val increases
    return this.yMax + this.pixelsPerVal * (val - this.minVal);
}

FunctionScale.prototype.valFromY = function(y)
{
    return this.minVal + (y - this.yMax) / this.pixelsPerVal;
}

// If you divide the height by this number, you get a number in the range [1, 10)
FunctionScale.prototype.intervalRescaler = function(height)
{
    exponent = Math.floor(Math.log10(height));
    return 10^exponent;
}

FunctionScale.prototype.calcMajorTickSpacing = function(height)
{
    const scale = this.intervalRescaler(height);
    const scaledHeight = height / scale; // Should be in [1, 10)
    const candidateScaledSpacings = [5, 2, 1];
    let spacing = 10;
    for (let i = 0; i < 10; ++i)
    {
        const scaleSpacingMultiplier = 10^(-i);
        for (const baseSpacing of candidateScaledSpacings)
        {
            const candidateScaledSpacing = baseSpacing * scaleSpacingMultiplier;
            const numMajorTicks = Math.floor(height / candidateScaledSpacing);
            if (numMajorTicks > this.maxMajorTicks) return spacing * scale;
            spacing = candidateScaledSpacing;
        }
    }
    return spacing * scale;
}

FunctionScale.prototype.updateScaleDetails = function(x, yMin, yMax) 
{
    this.x = x;
    this.yMin = yMin;
    this.yMax = yMax;
    this.valHeight = this.maxVal - this.minVal;
    this.pixHeight = this.yMax - this.yMin;
    this.pixelsPerVal = -this.pixHeight / this.valHeight; // Negative because pixels increment in the other direction
    this.majorTickSpacing = this.calcMajorTickSpacing(this.valHeight);
}

FunctionScale.prototype.drawScale = function () {
    tickLen = this.tickLen;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.moveTo(this.x, this.yMax)
    ctx.lineTo(this.x, this.yMin)
    halfTick = tickLen / 2

    const tickSpacing = this.majorTickSpacing / this.ticksPerMajor;

    const numTicks = Math.floor(this.valHeight / tickSpacing);
    const firstTick = tickSpacing * Math.ceil(this.minVal / tickSpacing);
    const firstMajorTick = this.majorTickSpacing * Math.ceil(this.minVal / this.majorTickSpacing);
    const firstMajorTickIndex = Math.round((firstMajorTick - firstTick) / tickSpacing);
    const origBaseline = ctx.textBaseline;
    ctx.textBaseline = 'middle';
    for (let index = 0; index < numTicks; index++) {
        const val = firstTick + tickSpacing * index;
        const y = this.yFromVal(val);
        const isMajor = (index - firstMajorTickIndex) % ticksPerMajor === 0;
        const thisTickLen = (isMajor ? tickLen : halfTick)
        // console.log("index = " + index + ", thisTickLen = " + thisTickLen)
        ctx.moveTo(x - thisTickLen, y)
        ctx.lineTo(x + thisTickLen, y)
        if (isMajor) {
            ctx.fillText(index / this.ticksPerMajor, x + 2 * thisTickLen, y);
        }
    }
    ctx.textBaseline = origBaseline;
}

FunctionBox.prototype.containsPoint = function (x, y) {
    return (x > this.x && x < this.x + this.width)
        && (y > this.y && y < this.y + this.height);
}

FunctionBox.prototype.handleContainsPoint = function (x, y) {
    return ((x - this.inHandleX) ** 2 + (y - this.inHandleY) ** 2 < this.handleHalfHeight ** 2);
}

FunctionBox.prototype.drawHandle = function (x, y) {
    ctx.fillStyle = "blue";
    let halfWidth = this.handleHalfWidth;
    let halfHeight = this.handleHalfHeight;
    ctx.beginPath();
    ctx.ellipse(x, y, halfWidth, halfHeight, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(x - halfWidth, y);
    ctx.lineTo(x + halfWidth, y);
    ctx.stroke();
}

FunctionBox.prototype.connect = function (fb) {
    this.downstream = fb;
}

FunctionBox.prototype.draw = function () {
    ctx.fillStyle = "green";
    ctx.fillRect(
        this.x,
        this.y,
        this.width,
        this.height
    );

    this.drawHandle(this.inHandleX, this.inHandleY);
    this.drawHandle(this.outHandleX, this.outHandleY);

    ctx.beginPath();
    this.inScale.drawScale();
    this.outScale.drawScale();
    ctx.stroke();

    let imWidth = this.img.width * 0.7;
    let imHeight = this.img.height * 0.7;
    let imXpos = this.x + (this.width - imWidth) * 0.5 + this.width * this.imageShift / 100;
    let imYpos = this.y + (this.height - imHeight) * 0.5;
    try {
        ctx.drawImage(this.img, imXpos, imYpos, imWidth, imHeight);
    } catch (e) {
        console.error(e);
    }

    // ctx.fillStyle = "white";
    // ctx.fillText(
    //     this.text,
    //     this.x + this.width * 0.5,
    //     this.y + this.height * 0.5,
    //     this.width
    // );
    ctx.fillText(this.getInput().toFixed(3), this.inScaleX, this.scaleTopY - 5, this.width);
    ctx.fillText(this.getOutput().toFixed(3), this.outScaleX, this.scaleTopY - 5, this.width)
}

