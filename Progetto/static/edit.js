const container = document.getElementById('container');
const tool = document.getElementById('tool');
const submit = document.getElementById('saving');
const file_url = document.getElementById('fileUrl').value;
const filename = document.getElementById('filename').value;

var width = window.innerWidth;
var height = window.innerHeight - 25;

// first we need Konva core things: stage and layer
var stage = new Konva.Stage({
    container: container,
    width: width * 0.5,
    height: height,
});

var layer = new Konva.Layer();
var background = new Konva.Layer();
stage.add(background);
stage.add(layer);

// then we are going to draw into special canvas element
var canvas = document.createElement('canvas');
canvas.width = stage.width();
canvas.height = stage.height();

// created canvas we can add to layer as "Konva.Image" element
var image = new Konva.Image({
    image: canvas,
    x: 0,
    y: 0,
    id: 'draw',
});
layer.add(image);

Konva.Image.fromURL(file_url, function (floorplan) {
    floorplan.setAttrs({
        width: width,
        height: height,
        scaleX: 0.5,
    });
    background.add(floorplan);
});

// Good. Now we need to get access to context element
var context = canvas.getContext('2d');
context.strokeStyle = '#df4b26';
context.lineJoin = 'round';
context.lineWidth = 5;

var isPaint = false;
var lastPointerPosition;
var mode = 'brush';
var draw = container;
//draw.style.cursor =  'crosshair';
draw.style.cursor = 'url("/static/brush.cur"), auto';
var select = tool;
select.addEventListener('change', function () {
    mode = select.value;
    changeCursor(mode);
});

image.on('mousedown touchstart', function () {
    isPaint = true;
    lastPointerPosition = stage.getPointerPosition();

    if (mode == 'rect') {
        var localPos = {
            x: lastPointerPosition.x - image.x(),
            y: lastPointerPosition.y - image.y(),
        };

        var rectangle = new Konva.Rect({
            x: localPos.x,
            y: localPos.y,
            width: 50,
            height: 50,
            fill: 'red',
            stroke: 'red',
            strokeWidth: 1,
            draggable: true
        });

        var transformer = new Konva.Transformer({
            nodes: [rectangle],
            borderEnabled: false,
            rotateAnchorOffset: 40,
            name: 'tr',
            enabledAnchors: ['middle-left', 'middle-right', 'bottom-center', 'top-center']
        });

        layer.add(rectangle, transformer);
        layer.draw();

        rectangle.on('mousedown touchstart', function () {
            if (mode == 'eraser') {
                transformer.resizeEnabled(false);
                transformer.rotateEnabled(false);
                rectangle.destroy();
            }
        });
    }

    if (mode == 'circle') {
        var localPos = {
            x: lastPointerPosition.x - image.x(),
            y: lastPointerPosition.y - image.y(),
        };

        var circle = new Konva.Circle({
            x: localPos.x,
            y: localPos.y,
            radius: 25,
            fill: 'red',
            stroke: 'red',
            strokeWidth: 1,
            draggable: true
        });

        var transformer = new Konva.Transformer({
            nodes: [circle],
            borderEnabled: false,
            rotateAnchorOffset: 40,
            name: 'tr',
            enabledAnchors: ['middle-left', 'middle-right', 'bottom-center', 'top-center']
        });

        layer.add(circle, transformer);
        layer.draw();

        circle.on('mousedown touchstart', function () {
            if (mode == 'eraser') {
                circle.destroy();
                transformer.resizeEnabled(false);
                transformer.rotateEnabled(false);
            }
        });
    }
});

// will it be better to listen move/end events on the window?

stage.on('mouseup touchend', function () {
    isPaint = false;
});

// and core function - drawing
stage.on('mousemove touchmove', function () {
    if (!isPaint) {
        return;
    }

    if (mode === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
    } else {
        context.globalCompositeOperation = 'source-over';
    }
    context.beginPath();

    if (mode == 'brush' || mode == 'eraser') {
        var localPos = {
            x: lastPointerPosition.x - image.x(),
            y: lastPointerPosition.y - image.y(),
        };
        context.moveTo(localPos.x, localPos.y);
        var pos = stage.getPointerPosition();
        localPos = {
            x: pos.x - image.x(),
            y: pos.y - image.y(),
        };
        context.lineTo(localPos.x, localPos.y);
        context.closePath();
        context.stroke();

        lastPointerPosition = pos;
        // redraw manually
        layer.batchDraw();
    }
});

function changeCursor(mode) {
    switch (mode) {
        case 'eraser':
            draw.style.cursor = 'url("/static/blackcursor.cur"), auto';
            break;
        case 'brush':
            draw.style.cursor = 'url("/static/brush.cur"), auto';
            break;
        default:
            draw.style.cursor = 'crosshair';
    }
}

saving = submit;
saving.addEventListener("submit", (e) => {
    e.preventDefault();
    transf = stage.find('.tr');
    transf.forEach((transfs) => {
        transfs.destroy();
    });
    if (save())
        window.location.href = save_image;
});

function downloadURI(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

function save() {
    var dataURL = stage.toDataURL({ pixelRatio: 1 });
    downloadURI(dataURL, filename);
    return true;
}

function clearDrawing() {
    location.reload();
}