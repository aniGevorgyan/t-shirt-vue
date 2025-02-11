import {store} from "@/store";
import {fabric} from "fabric";
import {cloneProxy} from "../utils";

export const Context = {
    canvas: null,
    canvas2: null,
    canvasMode: 'add',
};

class CanvasService {
    static fontSize = 22;
    static scale = 1;

    static cleanup() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    static addTextLayer(text = "Yans Print") {
        let center = Context.canvas.getCenter();
        let textLayer = new fabric.Text(text, {
            layerId: Date.now(),
            layerType: "text",
            mode: store.state.canvas.mode,
            fill: "#000000",
            fontSize: CanvasService.fontSize,
            fontFamily: "Lato",
            scaleX: 1,
            scaleY: 1,
            top: center.top,
            left: center.left,
            originX: "center",
            originY: "center",
            // strokeWidth: 20,
            borderColor: "#3474d4",
            cornerColor: "#3474d4",
            borderDashArray: [5, 5],
            // transparentCorners: false,
            _controlsVisibility: {
                mt: false,
                mb: false,
                ml: false,
                mr: false,
                tr: false,
            },
        });
        this.customizeResizeControl();
        this.customizeRotateControl(Context.canvas);
        this.customizeDeleteControl(Context.canvas);
        Context.canvas.add(textLayer);
        Context.canvas.setActiveObject(textLayer);

        this.cleanup();
        this.timeoutId = setTimeout(() => {
            Context.canvas.renderAll();
        }, 200);
    }

    static addImageLayer(url) {
        fabric.Image.fromURL(
            url,
            (imageLayer) => {
                imageLayer.set({
                    layerId: Date.now(),
                    layerType: "image",
                    mode: store.state.canvas.mode,
                    borderColor: "#3474d4",
                    cornerColor: "#3474d4",
                    borderDashArray: [5, 5],
                    // strokeWidth: 20,
                    // cornerSize: 10,
                    // transparentCorners: false,
                    _controlsVisibility: {
                        mt: false,
                        mb: false,
                        ml: false,
                        mr: false,
                        tr: false,
                    },
                });
                this.customizeResizeControl();
                this.customizeRotateControl(Context.canvas);
                this.customizeDeleteControl(Context.canvas);

                var imageWidth = Context.canvas.getWidth() * 0.5;
                imageLayer.scaleToWidth(imageWidth);
                Context.canvas.add(imageLayer);
                Context.canvas.centerObject(imageLayer);
                imageLayer.originX = "center";
                imageLayer.originY = "center";
                imageLayer.left = Context.canvas.getWidth() / 2;
                imageLayer.top = Context.canvas.getHeight() / 2;
                imageLayer.setCoords();
                Context.canvas.setActiveObject(imageLayer);
                this.cleanup();
                this.timeoutId = setTimeout(() => {
                    Context.canvas.renderAll();
                }, 200);
            },
            {
                crossOrigin: "anonymous",
            },
        );
    }

    static customizeResizeControl() {
        // Custom icon URL (replace this with your icon's URL)
        const customIconUrl = new URL('@/assets/scale.png', import.meta.url).href;

        // Create an image element for the custom icon
        const customResizeIcon = document.createElement("img");
        customResizeIcon.src = customIconUrl;

        // Customize the bottom-right corner control
        fabric.Object.prototype.controls.br = new fabric.Control({
            x: 0.5,
            y: 0.5,
            offsetX: 0,
            offsetY: 0,
            cursorStyle: "nwse-resize",
            actionHandler: fabric.controlsUtils.scalingEqually,
            render: function (ctx, left, top, styleOverride, fabricObject) {
                const size = 40;
                ctx.drawImage(customResizeIcon, left - size / 2, top - size / 2, size, size);
            },
        });
    }

    static customizeRotateControl(canvas) {
        // Custom icon URL for the rotate control (replace with your icon URL)
        const rotateIconUrl = new URL('@/assets/rotate.png', import.meta.url).href;

        // Create an image element for the custom icon
        const rotateIcon = document.createElement("img");
        rotateIcon.src = rotateIconUrl;

        // Customize the top-left rotate control
        fabric.Object.prototype.controls.mtr = new fabric.Control({
            x: -0.5,
            y: -0.5,
            offsetX: 0,
            offsetY: 0,
            cursorStyle: "pointer",
            actionHandler: fabric.controlsUtils.rotationWithSnapping,
            render: function (ctx, left, top, styleOverride, fabricObject) {
                const size = 28; // Custom icon size
                ctx.drawImage(rotateIcon, left - size / 2, top - size / 2, size, size);
            },
        });
    }

    static customizeDeleteControl(canvas) {
        // Custom delete icon URL (replace this with your delete icon URL)
        const deleteIconUrl = new URL('@/assets/remove.png', import.meta.url).href;

        // Create an image element for the custom icon
        const deleteIcon = document.createElement("img");
        deleteIcon.src = deleteIconUrl;

        // Customize the bottom-left corner control for deletion
        fabric.Object.prototype.controls.bl = new fabric.Control({
            x: -0.5,
            y: 0.5,
            offsetX: 0,
            offsetY: 0,
            cursorStyle: "pointer", // Cursor changes to indicate interaction
            mouseDownHandler: (eventData, transform, x, y) => {
                const target = transform.target;
                if (target) {
                    canvas.remove(target); // Remove the object from the canvas
                    canvas.discardActiveObject();
                    canvas.renderAll();
                }
                return true; // Stop further event handling
            },
            render: function (ctx, left, top, styleOverride, fabricObject) {
                const iconSize = 28; // Custom icon size
                ctx.drawImage(
                    deleteIcon,
                    left - iconSize / 2,
                    top - iconSize / 2,
                    iconSize,
                    iconSize
                );
            },
        });
    }

    static changeMode() {
        Context.canvas.getObjects().forEach((object) => {
            object.visible = object.mode != store.state.canvas.mode ? false : true;
        });
        Context.canvas.discardActiveObject();
        Context.canvas.renderAll();

        const json = Context.canvas.toJSON();
        Context.canvas2.loadFromJSON(json, Context.canvas2.renderAll.bind(Context.canvas2), function (o, object) {
            object.set('selectable', false);
        });
    }

    static selectLayer(layer, callback = () => {
    }) {
        Context.canvas.getObjects().forEach((object) => {
            if (object.layerId == layer.layerId) {
                Context.canvas.setActiveObject(object);
                Context.canvas.renderAll();
                callback(object);
            }
        });
    }

    static removeLayer(layer) {
        Context.canvas.getObjects().forEach((object) => {
            if (object.layerId == layer.layerId) {
                Context.canvas.remove(object);
                Context.canvas.renderAll();
            }
        });
    }

    static duplicateLayer(layer) {
        Context.canvas.getObjects().forEach((object) => {
            if (object.layerId == layer.layerId) {
                const clone = cloneProxy(object);
                clone.set({
                    layerId: Date.now(),
                    left: clone.left + 10,
                    top: clone.top + 10,
                });
                Context.canvas.add(clone);
                Context.canvas.renderAll();
            }
        });
    }

    static filter(name) {
        return {
            get() {
                return !!this.selectedLayer.filters.filter((f) => f.type == name)
                    .length;
            },
            set(value) {
                if (value) {
                    this.selectedLayer.filters.push(new fabric.Image.filters[name]());
                } else {
                    this.selectedLayer.filters = this.selectedLayer.filters.filter(
                        (f) => f.type != name,
                    );
                }
                this.selectedLayer.applyFilters();
            },
        };
    }

    static toJSON() {
        return Context.canvas.toJSON([
            "mode",
            "layerId",
            "layerType",
            "_controlsVisibility",
        ]);
    }

    static loadFromJSON(data, callback = () => {}) {
        Context.canvas.loadFromJSON(data, () => {
            Context.canvas.getObjects().forEach((object) => {
                if (object.type === 'text' || object.type === 'image') {
                    this.customizeResizeControl();
                    this.customizeRotateControl(Context.canvas);
                    this.customizeDeleteControl(Context.canvas);
                }
            });

            Context.canvas.renderAll();
            callback();
        });
    }

    static deleteAllLayers() {
        Context.canvas.getObjects().forEach((object) => {
            Context.canvas.remove(object);
        });
    }

    static prepareCrop(e) {
        var i = new fabric.Rect({
            id: "crop-rect",
            top: e.top,
            left: e.left,
            angle: e.angle,
            width: e.getScaledWidth(),
            height: e.getScaledHeight(),
            stroke: "rgb(42, 67, 101)",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            fill: "rgba(255, 255, 255, 1)",
            globalCompositeOperation: "overlay",
            lockRotation: true,
        });

        var a = new fabric.Rect({
            id: "overlay-rect",
            top: e.top,
            left: e.left,
            angle: e.angle,
            width: e.getScaledWidth(),
            height: e.getScaledHeight(),
            selectable: false,
            selection: false,
            fill: "rgba(0, 0, 0, 0.5)",
            lockRotation: true,
        });

        var s = e.cropX,
            o = e.cropY,
            c = e.width,
            l = e.height;

        e.set({
            cropX: null,
            cropY: null,
            left: e.left - s * e.scaleX,
            top: e.top - o * e.scaleY,
            width: e._originalElement.naturalWidth,
            height: e._originalElement.naturalHeight,
            dirty: false
        });
        i.set({
            left: e.left + s * e.scaleX,
            top: e.top + o * e.scaleY,
            width: c * e.scaleX,
            height: l * e.scaleY,
            dirty: false
        });
        a.set({
            left: e.left,
            top: e.top,
            width: e.width * e.scaleX,
            height: e.height * e.scaleY,
            dirty: false
        });
        i.oldScaleX = i.scaleX;
        i.oldScaleY = i.scaleY;

        Context.canvas.add(a)
        Context.canvas.add(i)
        Context.canvas.discardActiveObject()
        Context.canvas.setActiveObject(i)
        Context.canvas.renderAll()

        //
        i.on("moving", function () {
            (i.top < e.top || i.left < e.left) &&
            ((i.left = i.left < e.left ? e.left : i.left),
                (i.top = i.top < e.top ? e.top : i.top)),
            (i.top + i.getScaledHeight() > e.top + e.getScaledHeight() ||
                i.left + i.getScaledWidth() > e.left + e.getScaledWidth()) &&
            ((i.top =
                i.top + i.getScaledHeight() > e.top + e.getScaledHeight()
                    ? e.top + e.getScaledHeight() - i.getScaledHeight()
                    : i.top),
                (i.left =
                    i.left + i.getScaledWidth() > e.left + e.getScaledWidth()
                        ? e.left + e.getScaledWidth() - i.getScaledWidth()
                        : i.left));
        });

        i.on("deselected", function () {
            CanvasService.cropImage(i, e);
            Context.canvas.remove(a);
        });
    }

    static cropImage(i, e) {
        Context.canvas.remove(i);

        const s = (i.left - e.left) / e.scaleX,
            o = (i.top - e.top) / e.scaleY,
            c = (i.width * i.scaleX) / e.scaleX,
            l = (i.height * i.scaleY) / e.scaleY;

        e.set({
            cropX: s,
            cropY: o,
            width: c,
            height: l,
            top: e.top + o * e.scaleY,
            left: e.left + s * e.scaleX,
            selectable: true,
            cropped: 1,
        });

        Context.canvas.renderAll();
    }
}

export default CanvasService;
