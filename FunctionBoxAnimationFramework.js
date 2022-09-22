var imageWidth = window.innerWidth;
var imageHeight = window.innerHeight;
var canvas = null;
var ctx = null;
var bounds = null;
var selectedBox = null;
var animatedBox = null;
var panX = 0;
var panY = 0;
var mouseX = 0;
var mouseY = 0;
var oldMouseX = 0;
var oldMouseY = 0;
var mouseShiftX = 0;
var mouseShiftY = 0;
var mouseHeld = false;
var boxArray = [];

window.onmousedown = function (e) {
    mouseHeld = true;

    if (!selectedBox) {
        for (var i = boxArray.length - 1; i > -1; --i) {
            handleSelected = false;
            boxSelected = false;
            if (boxArray[i].handleContainsPoint(mouseX, mouseY)) {
                handleSelected = true;
                boxSelected = true;
            } else if (boxArray[i].containsPoint(mouseX, mouseY)) {
                boxSelected = true;
            }
            if (boxSelected) {
                selectedBox = boxArray[i];
                selectedBox.isSelected = true;
                mouseStartX = e.clientX - bounds.left;
                mouseStartY = e.clientY - bounds.top;
                if (handleSelected) {
                    selectedBox.handleGrabbed = true;
                    mouseShiftX = mouseStartX - selectedBox.inHandleX;
                    mouseShiftY = mouseStartY - selectedBox.inHandleY;
                } else {
                    selectedBox.handleGrabbed = false;
                    mouseShiftX = mouseStartX - selectedBox.x;
                    mouseShiftY = mouseStartY - selectedBox.y;
                }
                requestAnimationFrame(draw);
                return;
            }
        }
    }
}

window.onmousemove = function (e) {
    mouseX = e.clientX - bounds.left;
    mouseY = e.clientY - bounds.top;

    if (mouseHeld) {
        if (selectedBox) {
            if (selectedBox.handleGrabbed) {
                newInHandleY = mouseY - mouseShiftY
                selectedBox.setInHandleY(newInHandleY);
            } else {
                const newX = mouseX - mouseShiftX;
                const newY = mouseY - mouseShiftY;
                selectedBox.setPosition(newX, newY);
            }
        }
    }

    oldMouseX = mouseX;
    oldMouseY = mouseY;

    requestAnimationFrame(draw);
}

window.onmouseup = function (e) {
    mouseHeld = false;

    if (selectedBox) {
        selectedBox.isSelected = false;
        selectedBox = null;
        requestAnimationFrame(draw);
    }
}

function draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, imageWidth, imageHeight);

    var box = null;
    var xMin = 0;
    var xMax = 0;
    var yMin = 0;
    var yMax = 0;

    for (var i = 0; i < boxArray.length; ++i) {
        box = boxArray[i];
        box.draw();
    }
}

function point(x, y) {
    return {x: x, y: y};
}

function piecewiseLinear(x, points) {
    if (points.length === 0) return NaN;
    for (let i = 0; i < points.length; i++) {
        let b = points[i];
        if (x < b.x) {
            if (i === 0) {
                return b.y;
            } else {
                let a = points[i - 1];
                let m = (b.y - a.y) / (b.x - a.x);
                return a.y + m * (x - a.x);
            }
        }
    }
    // If we have not yet returned, then x is higher than the highest x value in the array
    return points[points.length - 1].y;
}

function animateBoxes(t0sec, t1sec, inputFunc) {
    let startMs, previousTimeStampMs;

    durationMs = (t1sec - t0sec) * 1000;

    function step(timestampMs) {

        animatedBox = boxArray[0];

        if (startMs === undefined) {
            startMs = timestampMs;
        }
        const elapsedMs = timestampMs - startMs;

        if (previousTimeStampMs !== timestampMs) {
            // Math.min() is used here to make sure the motion stops after exactly the desired duration
            const currTimeSec = t0sec + Math.min(elapsedMs, durationMs) / 1000;
            const fnInput = inputFunc(currTimeSec);
            animatedBox.setInput(fnInput);
            draw();
        }

        if (elapsedMs < durationMs) { // Stop the animation after 2 seconds
            previousTimeStampMs = timestampMs
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

window.onunload = function () {
    canvas = null;
    ctx = null;
    bounds = null;
    selectedBox = null;
    boxArray = null;
}
