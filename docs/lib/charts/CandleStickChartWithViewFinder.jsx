"use strict";

import React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart, series, scale, coordinates, tooltip, axes, indicator, helper } from "react-stockcharts";

var { CandlestickSeries, BarSeries, LineSeries, AreaSeries, MACDSeries } = series;
var { discontinuousTimeScaleProvider } = scale;

var { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } = coordinates;
var { EdgeIndicator } = coordinates;

var { OHLCTooltip, MovingAverageTooltip, MACDTooltip } = tooltip;

var { XAxis, YAxis } = axes;
var { macd, ema, sma } = indicator;

var { fitWidth } = helper;

class CandleStickChartWithViewFinder extends React.Component {
	getChartCanvas() {
		return this.refs.chartCanvas;
	}
	render() {
		var { data, type, width, ratio } = this.props;

		var ema26 = ema()
			.id(0)
			.windowSize(26)
			.merge((d, c) => {d.ema26 = c})
			.accessor(d => d.ema26);

		var ema12 = ema()
			.id(1)
			.windowSize(12)
			.merge((d, c) => {d.ema12 = c})
			.accessor(d => d.ema12);

		var macdCalculator = macd()
			.fast(12)
			.slow(26)
			.signal(9)
			.merge((d, c) => {d.macd = c})
			.accessor(d => d.macd);

		var smaVolume50 = sma()
			.id(3)
			.windowSize(10)
			.sourcePath("volume")
			.merge((d, c) => {d.smaVolume50 = c})
			.accessor(d => d.smaVolume50);

		const startIndex = data.length - 200;
		const endIndex = data.length - 1;

		return (
			<ChartCanvas ref="chartCanvas" ratio={ratio} width={width} height={600}
					margin={{ left: 70, right: 70, top: 20, bottom: 30 }} type={type}
					seriesName="MSFT"
					data={data} calculator={[ema26, ema12, smaVolume50, macdCalculator]}
					xExtents={[data[startIndex].date, data[endIndex].date]}
					xAccessor={d => d.date} xScaleProvider={discontinuousTimeScaleProvider}>
				<Chart id={1} height={400}
						yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
						padding={{ top: 10, bottom: 20 }}>
					<XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
					<YAxis axisAt="right" orient="right" ticks={5} />

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<CandlestickSeries />
					<LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()}/>
					<LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()}/>

					<CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
					<CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

					<EdgeIndicator itemType="last" orient="right" edgeAt="right"
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>

					<OHLCTooltip origin={[-40, 0]}/>
					<MovingAverageTooltip onClick={(e) => console.log(e)} origin={[-38, 15]}
						calculators={[ema26, ema12]}/>
				</Chart>
				<Chart id={2} height={150}
						yExtents={[d => d.volume, smaVolume50.accessor()]}
						origin={(w, h) => [0, h - 300]}>
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format("s")}/>

					<MouseCoordinateY
						at="left"
						orient="left"
						displayFormat={format(".4s")} />

					<BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
					<AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()}/>
				</Chart>
				<Chart id={3} height={150}
						yExtents={macdCalculator.accessor()}
						origin={(w, h) => [0, h - 150]} padding={{ top: 10, bottom: 10 }} >
					<XAxis axisAt="bottom" orient="bottom"/>
					<YAxis axisAt="right" orient="right" ticks={2} />

					<MouseCoordinateX
						at="bottom"
						orient="bottom"
						displayFormat={timeFormat("%Y-%m-%d")} />
					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<MACDSeries calculator={macdCalculator} />
					<MACDTooltip origin={[-38, 15]} calculator={macdCalculator}/>
				</Chart>
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

CandleStickChartWithViewFinder.propTypes = {
	data: React.PropTypes.array.isRequired,
	width: React.PropTypes.number.isRequired,
	ratio: React.PropTypes.number.isRequired,
	type: React.PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartWithViewFinder.defaultProps = {
	type: "svg",
};

CandleStickChartWithViewFinder = fitWidth(CandleStickChartWithViewFinder);

export default CandleStickChartWithViewFinder;
