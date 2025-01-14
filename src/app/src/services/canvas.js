import {store} from "@/store";
import {fabric} from "fabric";
import {cloneProxy} from "../utils";

import MediaService from "@/services/media";

export const Context = {
    canvas: null,
    canvas2: null,
    canvasMode: 'add',
};

class CanvasService {
    static fontSize = 16;
    static scale = 1;

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
            borderColor: "#3474d4",
            cornerColor: "#3474d4",
            borderDashArray: [5, 5],
            // transparentCorners: false,
            _controlsVisibility: {
                mt: false,
                mb: false,
                ml: false,
                mr: false,
                bl: false,
                tr: false,
                mtr: false,
            },
        });
        this.customizeResizeControl();
        this.customizeRotateControl(Context.canvas);
        Context.canvas.add(textLayer);
        Context.canvas.setActiveObject(textLayer);
        Context.canvas.renderAll();
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
                    strokeWidth: 20,
                    cornerSize: 10,
                    // transparentCorners: false,
                    _controlsVisibility: {
                        mt: false,
                        mb: false,
                        ml: false,
                        mr: false,
                        bl: false,
                        tr: false,
                        mtr: false,
                    },
                });
                var imageWidth = Context.canvas.getWidth() * 0.5;
                imageLayer.scaleToWidth(imageWidth);
                this.customizeResizeControl();
                this.customizeRotateControl(Context.canvas);
                Context.canvas.add(imageLayer);
                Context.canvas.centerObject(imageLayer);
                imageLayer.setCoords();
                Context.canvas.setActiveObject(imageLayer);
                Context.canvas.renderAll();
            },
            {
                crossOrigin: "anonymous",
            },
        );
    }

    static customizeResizeControl() {
        // Custom icon URL (replace this with your icon's URL)
        const customIconUrl = "https://img.icons8.com/ios/50/000000/resize-diagonal.png";

        // Create an image element for the custom icon
        fabric.Object.prototype.controls.mtr.visible = false; // Hide default rotate control
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
                const size = 24; // Custom icon size
                ctx.drawImage(customResizeIcon, left - size / 2, top - size / 2, size, size);
            },
        });
    }

    static customizeRotateControl(canvas) {
        // Custom icon URL for the rotate control (replace with your icon URL)
        const rotateIconUrl = "https://img.icons8.com/ios/50/000000/rotate.png";

        // Create an image element for the custom icon
        const rotateIcon = document.createElement("img");
        rotateIcon.src = rotateIconUrl;

        // Customize the top-left rotate control
        fabric.Object.prototype.controls.tl = new fabric.Control({
            x: -0.5,
            y: -0.5,
            offsetX: 0,
            offsetY: 0,
            cursorStyle: "rotate", // Cursor changes to indicate rotation
            actionHandler: fabric.controlsUtils.rotationWithSnapping,
            render: function (ctx, left, top, styleOverride, fabricObject) {
                const size = 24; // Custom icon size
                ctx.drawImage(rotateIcon, left - size / 2, top - size / 2, size, size);
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

    static loadFromJSON(data, callback = () => {
    }) {
        Context.canvas.loadFromJSON(data, callback);
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
