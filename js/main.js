var canvas = document.getElementById("output")

canvas.width = (window.innerWidth - 20) * 2
canvas.height = 100
canvas.style.width = (window.innerWidth - 20) + "px"
canvas.style.height = "50px"

var ctx = canvas.getContext("2d")

var sort_counts = "" !== getCookie("sort_counts") ? (getCookie("sort_counts") === "true") : true

var separate_with_lines = "" !== getCookie("separate_with_lines") ? (getCookie("separate_with_lines") === "true") : true

var hide_extinct_counts = "" !== getCookie("hide_extinct_counts") ? (getCookie("hide_extinct_counts") === "true") : true

var make_colors_distinct = "" !== getCookie("make_colors_distinct") ? (getCookie("make_colors_distinct") === "true") : true

var chart_counts_enabled = "" !== getCookie("chart_counts_enabled") ? (getCookie("chart_counts_enabled") === "true") : true

ctx.strokeStyle = "#000000"
ctx.lineWidth = 1

var simulator_interval_id

var population_size = -1
var population = []

var generation_number = 0

var number_of_gens_to_simulate = -1

var running = false

var one_left = false

var do_graph = true

$("input#population-size, input#num-of-gens-to-sim, input#speed").on("keydown", function (e) {
	if (e.keyCode === 13) { //checks whether the pressed key is "Enter"
		if (running) {
			stop()
		} else {
			reset_if_needed()

			if (!running) {
				reset()
			}

			run_auto()
		}
	}
});

$("button#run").click(function () {
	reset_if_needed()

	if (!running) {
		reset()
	}

	run_auto()
})

function reset() {
	stop()

	generation_number = 0

	chart.options.data = []

	population = []

	// Fill it with one of every phenotype
	for (var i = 0; i < population_size; i++) {
		population.push(i)

		var ratio = i / population_size

		var hue;
		if (make_colors_distinct) {
			hue = (128 * (ratio + i))
		} else {
			hue = 255 * ratio
		}

		chart.options.data.push({
			type: "line",
			markerType: "none",
			color: "hsl(" + hue + ", 100%, 50%)",
			dataPoints: []
		});
	}

	one_left = false

	render()
}

function reset_if_needed() {
	stop()

	needs_reset = false

	if (one_left) {
		needs_reset = true
	}

	new_pop_size = parseInt($('input#population-size').val() || 100)
	if (population_size != new_pop_size) {
		population_size = new_pop_size

		needs_reset = true
	}

	new_gens_to_sim = Math.max(parseInt($('input#num-of-gens-to-sim').val()), 0) || -1
	if (number_of_gens_to_simulate != new_gens_to_sim) {
		number_of_gens_to_simulate = new_gens_to_sim

		needs_reset = true
	}

	if (needs_reset) {
		reset()
	}
}

function run_auto() {
	running = true

	set_button_pause()

	var speed = parseInt($('input#speed').val()) || 10
	simulator_interval_id = setInterval(simulate_step, speed)

	render()
}

function manual_step() {
	reset_if_needed()

	var num_of_gens_to_sim_this_step = Math.max(parseInt($('input#gens-per-step').val()) || 1, 1)

	for (var i = 0; i < num_of_gens_to_sim_this_step; i++) {
		simulate_step()
	}

	render()
}

$('button#step').click(manual_step)

$("input#gens-per-step").on("keydown", function (e) {
	if (e.keyCode === 13) { //checks whether the pressed key is "Enter"
		manual_step()
	}
});

$('button#reset').click(function () {
	set_button_unpause()
	reset()

	render()
})

$('button#pause').click(pause)

function stop() {
	clearInterval(simulator_interval_id)
	running = false

	set_button_unpause()
}

function pause() {
	stop()

	set_button_unpause()
}

function unpause() {
	set_button_pause()

	reset_if_needed()
	run_auto()

	render()
}

function set_button_pause() {
	$('button#unpause').unbind('click')
	$('button#unpause').click(pause)

	$('button#unpause').html('Pause')
	$('button#unpause').attr('id', 'pause')
}

function set_button_unpause() {
	$('button#pause').unbind('click')
	$('button#pause').click(unpause)

	$('button#pause').html('Run')
	$('button#pause').attr('id', 'unpause')
}

function simulate_step() {
	new_population = []

	phenotype_counts = []

	for (var i = 0; i < population_size; i++) {
		phenotype_counts[i] = {
			'id': i,
			'count': 0
		}
	}

	var all_the_same = true
	var all_the_same_phenotype_so_far = -1
	for (var i = 0; i < population_size; i++) {
		var selected_idx = Math.floor(Math.random() * population_size)
		var selected_phenotype = population[selected_idx]
		new_population.push(selected_phenotype)

		phenotype_counts[selected_phenotype].count += 1

		if (all_the_same_phenotype_so_far == -1) {
			all_the_same_phenotype_so_far = selected_phenotype
		}

		if (all_the_same && all_the_same_phenotype_so_far != selected_phenotype) {
			all_the_same = false
		}
	}

	if (sort_counts) {
		phenotype_counts = phenotype_counts.sort(function (a, b) {
			return b.count - a.count;
		});
	}

	population = new_population

	// sort for an organized visual effect
	population = population.sort(function (a, b) {
		return a - b;
	});

	phenotype_counts_text = ''

	// NOTE: population_size is used to represent the total number of original phentoypes
	for (var i = 0; i < population_size; i++) {
		var phenotype_id_and_count = phenotype_counts[i]

		var id = phenotype_id_and_count.id
		var count = phenotype_id_and_count.count

		chart.options.data[id].dataPoints.push({
			y: count
		})

		if (hide_extinct_counts && count == 0) {
			continue
		}

		var number_str = '#' + id

		phenotype_counts_text += 'Phentotype '
		phenotype_counts_text += ('     ' + number_str).substring(number_str.length);
		phenotype_counts_text += ': '
		phenotype_counts_text += '' + count
		phenotype_counts_text += '\n'
	}

	$('div#phenotype-counts').text(phenotype_counts_text)

	$('div#gen-num').text(generation_number)
	generation_number++

	if (all_the_same) {
		one_left = true
	}

	if (all_the_same || (number_of_gens_to_simulate != -1 && generation_number > number_of_gens_to_simulate)) {
		stop()
	}
}

function render() {
	if (chart_counts_enabled) {
		chart.render();
	}

	var width_per_cell = canvas.width / population_size

	var last_phenotype = population[0]
	var start_idx = 0

	for (var i = 0; i < population_size; i++) {
		var phenotype = population[i]
		var last_was_different = last_phenotype != phenotype

		if (last_was_different) {
			var x = width_per_cell * i

			var ratio = population[start_idx] / population_size

			var hue;
			if (make_colors_distinct) {
				hue = (128 * (ratio + population[start_idx]))
			} else {
				hue = 255 * ratio
			}

			ctx.fillStyle = "hsl(" + hue + ", 100%, 50%)"

			ctx.fillRect(start_idx * width_per_cell, 0, width_per_cell * (i - start_idx) + 2, canvas.height)

			start_idx = i

			last_phenotype = phenotype
		}
	}

	var ratio = population[start_idx] / population_size

	var hue;
	if (make_colors_distinct) {
		hue = (128 * (ratio + population[start_idx]))
	} else {
		hue = 255 * ratio
	}

	ctx.fillStyle = "hsl(" + hue + ", 100%, 50%)"

	ctx.fillRect(start_idx * width_per_cell, 0, width_per_cell * (population_size - start_idx) + 2, canvas.height)



	last_phenotype = population[0]

	for (var i = 0; i < population_size; i++) {
		var phenotype = population[i]

		var x = width_per_cell * i

		var last_was_different = last_phenotype != phenotype

		if (last_was_different) {
			ctx.lineWidth = 3
		}

		if (separate_with_lines || last_was_different) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
			ctx.closePath()
		}

		if (last_was_different) {
			ctx.lineWidth = 1
		}

		last_phenotype = phenotype
	}

	if (running) {
		requestAnimationFrame(render)
	}
}

// w3schools
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// w3schools
function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

$('input#sort-counts').change(function () {
	var ischecked = $(this).is(":checked")
	sort_counts = ischecked

	setCookie("sort_counts", ischecked, 999)
});

$('input#separate-cells-w-lines').change(function () {
	var ischecked = $(this).is(":checked")
	separate_with_lines = ischecked

	setCookie("separate_with_lines", ischecked, 999)
});

$('input#hide-extinct').change(function () {
	var ischecked = $(this).is(":checked")
	hide_extinct_counts = ischecked

	setCookie("hide_extinct_counts", ischecked, 999)
});

$('input#make-colors-distinct').change(function () {
	var ischecked = $(this).is(":checked")
	make_colors_distinct = ischecked

	for (var i = 0; i < population_size; i++) {
		var ratio = i / population_size

		var hue;
		if (make_colors_distinct) {
			hue = (128 * (ratio + i))
		} else {
			hue = 255 * ratio
		}

		chart.options.data[i].color = "hsl(" + hue + ", 100%, 50%)"
	}

	chart.render()

	render()

	setCookie("make_colors_distinct", ischecked, 999)
});

$('input#chart-counts').change(function () {
	var ischecked = $(this).is(":checked")
	chart_counts_enabled = !ischecked

	$('#chartCanvas').toggle(chart_counts_enabled)

	try {
		chart.render()
	} catch (e) {

	}

	setCookie("chart_counts_enabled", !ischecked, 999)
});;
