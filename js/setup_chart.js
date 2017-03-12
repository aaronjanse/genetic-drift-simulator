var chartCtx = document.getElementById('chartCanvas')
var chart = new CanvasJS.Chart(chartCtx, {
	title: {
		text: "Phenotype Counts"
	},
	data: [{
		type: "line",
		markerType: "none",
		dataPoints: []
	}],
	options: {
		data: [],
		spanGaps: true,
		scales: {
			yAxes: [{
				stacked: true
			}]
		}
	}
});

window.onload = function () {
	chart.render()
}
