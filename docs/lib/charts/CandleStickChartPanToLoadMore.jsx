"use strict";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import React from "react";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
	BarSeries,
	AreaSeries,
	CandlestickSeries,
	LineSeries,
	MACDSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
	CrossHairCursor,
	EdgeIndicator,
	CurrentCoordinate,
	MouseCoordinateX,
	MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProviderBuilder } from "react-stockcharts/lib/scale";
import { OHLCTooltip, MovingAverageTooltip, MACDTooltip } from "react-stockcharts/lib/tooltip";
import { ema, sma, macd } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";

function getMaxUndefined(calculators) {
	return calculators.map(each => each.undefinedLength()).reduce((a, b) => Math.max(a, b));
}
const LENGTH_TO_SHOW = 180;

const macdStroke = {
	macd: "#FF0000",
	signal: "#00F300",
};

const macdFill = {
	divergence: "#4682B4"
};

class CandleStickChartPanToLoadMore extends React.Component {
	constructor(props) {
		super(props);
		var { data: inputData } = props;

		var ema26 = ema()
			.id(0)
			.windowSize(26)
			.merge((d, c) => {d.ema26 = c;})
			.accessor(d => d.ema26);

		var ema12 = ema()
			.id(1)
			.windowSize(12)
			.merge((d, c) => {d.ema12 = c;})
			.accessor(d => d.ema12);

		var macdCalculator = macd()
			.fast(12)
			.slow(26)
			.signal(9)
			.merge((d, c) => {d.macd = c;})
			.accessor(d => d.macd);

		var smaVolume50 = sma()
			.id(3)
			.windowSize(50)
			.sourcePath("volume")
			.merge((d, c) => {d.smaVolume50 = c;})
			.accessor(d => d.smaVolume50);

		var maxWindowSize = getMaxUndefined([ema26,
			ema12,
			macdCalculator,
			smaVolume50
		]);
		/* SERVER - START */
		var dataToCalculate = inputData.slice(-LENGTH_TO_SHOW - maxWindowSize);

		var calculatedData = ema26(ema12(macdCalculator(smaVolume50(dataToCalculate))));
		var indexCalculator = discontinuousTimeScaleProviderBuilder().indexCalculator();

		// console.log(inputData.length, dataToCalculate.length, maxWindowSize)
		var { index } = indexCalculator(calculatedData);
		/* SERVER - END */

		var xScaleProvider = discontinuousTimeScaleProviderBuilder()
			.withIndex(index);
		var { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData.slice(-LENGTH_TO_SHOW));

		// console.log(head(linearData), last(linearData))
		// console.log(linearData.length)

		this.state = {
			ema26,
			ema12,
			macdCalculator,
			smaVolume50,
			linearData,
			data: linearData,
			xScale,
			xAccessor, displayXAccessor
		};
		this.handleDownloadMore = this.handleDownloadMore.bind(this);
	}
	handleDownloadMore(start, end) {
		if (Math.ceil(start) === end) return;
		// console.log("rows to download", rowsToDownload, start, end)
		var { data: prevData, ema26, ema12, macdCalculator, smaVolume50 } = this.state;
		var { data: inputData } = this.props;


		if (inputData.length === prevData.length) return;

		var rowsToDownload = end - Math.ceil(start);

		var maxWindowSize = getMaxUndefined([ema26,
			ema12,
			macdCalculator,
			smaVolume50
		]);

		/* SERVER - START */
		var dataToCalculate = inputData
			.slice(-rowsToDownload - maxWindowSize - prevData.length, - prevData.length);

		var calculatedData = ema26(ema12(macdCalculator(smaVolume50(dataToCalculate))));
		var indexCalculator = discontinuousTimeScaleProviderBuilder()
			.initialIndex(Math.ceil(start))
			.indexCalculator();
		var { index, interval } = indexCalculator(
			calculatedData
				.slice(-rowsToDownload)
				.concat(prevData));
		/* SERVER - END */

		var xScaleProvider = discontinuousTimeScaleProviderBuilder()
			.initialIndex(Math.ceil(start))
			.withIndex(index)
			.withInterval(interval);

		var { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData.slice(-rowsToDownload).concat(prevData));

		// console.log(linearData.length)
		setTimeout(() => {
			// simulate a lag for ajax
			this.setState({
				data: linearData,
				xScale,
				xAccessor,
				displayXAccessor,
			});
		}, 300);
	}
	render() {
		var { type, width, ratio } = this.props;
		var { data, ema26, ema12, macdCalculator, smaVolume50, xScale, xAccessor, displayXAccessor } = this.state;

		return (
			<ChartCanvas ratio={ratio} width={width} height={600}
					margin={{ left: 70, right: 70, top: 20, bottom: 30 }} type={type}
					seriesName="MSFT"
					data={data}
					xScale={xScale} xAccessor={xAccessor} displayXAccessor={displayXAccessor}
					onLoadMore={this.handleDownloadMore}>
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
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".0s")}/>

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

					<MACDSeries yAccessor={d => d.macd}
						stroke={macdStroke}
						fill={macdFill} />
					<MACDTooltip origin={[-38, 15]} calculator={macdCalculator}/>
				</Chart>
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

/*

*/

CandleStickChartPanToLoadMore.propTypes = {
	data: React.PropTypes.array.isRequired,
	width: React.PropTypes.number.isRequired,
	ratio: React.PropTypes.number.isRequired,
	type: React.PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartPanToLoadMore.defaultProps = {
	type: "svg",
};

CandleStickChartPanToLoadMore = fitWidth(CandleStickChartPanToLoadMore);

export default CandleStickChartPanToLoadMore;
