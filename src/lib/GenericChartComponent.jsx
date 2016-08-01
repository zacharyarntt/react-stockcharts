"use strict";

import React, { PropTypes, Component } from "react";
import d3 from "d3";
import { noop } from "./utils";
import GenericComponent from "./GenericComponent";

class GenericChartComponent extends GenericComponent {
	constructor(props, context) {
		super(props, context);

		this.listener = this.listener.bind(this);
		this.preCanvasDraw = this.preCanvasDraw.bind(this);
		this.postCanvasDraw = this.postCanvasDraw.bind(this);
	}
	preCanvasDraw(ctx) {
		ctx.save();
		var { canvasOriginX, canvasOriginY, width, height } = this.context;
		var { clip } = this.props;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(canvasOriginX, canvasOriginY);

		if (clip) {
			ctx.beginPath();
			ctx.rect(-1, -1, width + 1, height + 1);
			ctx.clip();
		}
	}
	postCanvasDraw(ctx) {
		ctx.restore();
	}
	listener(type, moreProps, e) {
		// console.log(type, moreProps, e)
		this.updateMoreProps(moreProps);
		var { chartConfig: chartConfigList } = moreProps;

		if (chartConfigList) {
			var { chartId } = this.context;
			var chartConfig = chartConfigList
				.filter(each => each.id === chartId)[0];
			this.moreProps.chartConfig = chartConfig
		}
		this.evaluateType(type, e)
	}
}

GenericChartComponent.propTypes = GenericComponent.propTypes;

GenericChartComponent.defaultProps = GenericComponent.defaultProps;

GenericChartComponent.contextTypes = {
	...GenericChartComponent.contextTypes,
	chartId: PropTypes.number.isRequired,
	chartConfig: PropTypes.object.isRequired,
};

export default GenericChartComponent;
