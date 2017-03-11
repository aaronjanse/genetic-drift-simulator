var canvas = document.getElementById("output")
var ctx = canvas.getContext("2d")

var sort_counts = true

var separate_with_lines = true

var hide_extinct_counts = true

ctx.strokeStyle = "#000000"
ctx.lineWidth = 1

var simulator_interval_id

var population_size = -1
var population = []

var generation_number = 0

var number_of_gens_to_simulate = -1

var running = false

var one_left = false

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

	population = []

	// Fill it with one of every phenotype
	for (var i = 0; i < population_size; i++) {
		population.push(i)
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
}

function manual_step() {
	reset_if_needed()

	var num_of_gens_to_sim_this_step = Math.max(parseInt($('input#gens-per-step').val()) || 1, 1)

	for (var i = 0; i < num_of_gens_to_sim_this_step; i++) {
		simulate_step()
	}
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

	render()

	phenotype_counts_text = ''

	// NOTE: population_size is used to represent the total number of original phentoypes
	for (var i = 0; i < population_size; i++) {
		var phenotype_id_and_count = phenotype_counts[i]

		var id = phenotype_id_and_count.id
		var count = phenotype_id_and_count.count

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
		// number_of_gens_to_simulate = generation_number
		stop()
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	var width_per_cell = canvas.width / population_size

	var last_phenotype = population[0]

	for (var i = 0; i < population_size; i++) {
		var phenotype = population[i]

		var hue = 255 * (phenotype / population_size)

		ctx.fillStyle = "hsl(" + hue + ", 100%, 50%)"

		var x = width_per_cell * i
			// x = Math.floor(x)

		ctx.fillRect(x, 0, width_per_cell + 2, canvas.height)

		var last_was_different = last_phenotype != phenotype

		if (last_was_different) {
			ctx.lineWidth = 2
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
}

$('input#sort-counts').change(function () {
	var ischecked = $(this).is(":checked")
	sort_counts = ischecked
});

$('input#separate-cells-w-lines').change(function () {
	var ischecked = $(this).is(":checked")
	separate_with_lines = ischecked
});

$('input#hide-extinct').change(function () {
	var ischecked = $(this).is(":checked")
	hide_extinct_counts = ischecked
});
