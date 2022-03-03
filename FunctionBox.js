function FunctionBox(x, y, width, height, fn, text) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fn = fn;
    this.text = text;
    this.handleHalfWidth = 0.1 * width;
    this.handleHalfHeight = this.handleHalfWidth;
    this.inHandleYshift = 0;
    this.maxInput = 5;
    this.isSelected = false;
    this.downstream = null;
    this.updateBoxDetails();
}

FunctionBox.prototype.inputFromHandleYshift = function (handleYshift) {
    return handleYshift / this.yScale;
}

FunctionBox.prototype.handleYshiftFromInput = function (input) {
    return input * this.yScale;
}

FunctionBox.prototype.setInput = function (input) {
    this.inHandleYshift = this.handleYshiftFromInput(input);
}

FunctionBox.prototype.getInput = function () {
    console.log("getInput: " + this.inHandleYshift);
    return this.inputFromHandleYshift(this.inHandleYshift);
}

// Called when a control is moved or the box is otherwise changed
FunctionBox.prototype.updateBoxDetails = function () {
    this.scaleMargin = 30;
    this.inScaleX = this.x + this.scaleMargin;
    this.outScaleX = this.x + this.width - this.scaleMargin
    this.scaleTopY = this.y + this.scaleMargin;
    this.scaleBottomY = this.y + this.height - this.scaleMargin;
    this.yMid = this.y + this.height / 2;
    this.yScale = -this.height / (2 * this.maxInput);
    if (typeof this.fn === 'function') {
        this.output = this.fn(this.getInput());
    } else {
        this.output = 0;
    }
    console.log("output = " + this.output);
    if (this.downstream instanceof FunctionBox) {
        this.downstream.setInput(this.output);
        this.downstream.updateBoxDetails();
    }
    this.inHandleX = this.x;
    this.inHandleY = this.yMid + this.inHandleYshift;
    this.outHandleX = this.x + this.width;
    this.outHandleY = this.yMid + this.yScale * this.output;
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

FunctionBox.prototype.drawScale = function (x, ticksPerUnit, tickLen) {
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.moveTo(x, this.scaleTopY)
    ctx.lineTo(x, this.scaleBottomY)
    halfTick = tickLen / 2

    tickSpacing = 1.0 / ticksPerUnit

    numTicks = Math.floor((this.scaleTopY - this.yMid) / (this.yScale * tickSpacing))
    for (let index = -numTicks; index <= numTicks; index++) {
        y = this.yMid + index * tickSpacing * this.yScale;
        isUnit = index % ticksPerUnit == 0;
        thisTickLen = (isUnit ? tickLen : halfTick)
        // console.log("index = " + index + ", thisTickLen = " + thisTickLen)
        ctx.moveTo(x - thisTickLen, y)
        ctx.lineTo(x + thisTickLen, y)
        if (isUnit) {
            ctx.fillText(index / ticksPerUnit, x + 2 * thisTickLen, y);
        }
    }
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

    tickIncrement = 0.1;
    ctx.beginPath();
    this.drawScale(this.inScaleX, 5, 10);
    this.drawScale(this.outScaleX, 5, 10)
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.fillText(
        this.text,
        this.x + this.width * 0.5,
        this.y + this.height * 0.5,
        this.width
    );
    ctx.fillText(this.getInput().toFixed(3), this.inScaleX, this.scaleTopY - 5, this.width);
}

