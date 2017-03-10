var canvas = document.getElementById("output")

canvas.width = window.innerWidth * 2

var ctx = canvas.getContext("2d")

ctx.strokeStyle = "rgba(0, 1, 1, 0)"

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

	// if (number_of_gens_to_simulate != -1 && generation_number >= number_of_gens_to_simulate) {
	// 	needs_reset = true
	// }

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

	var all_the_same = true
	var all_the_same_phenotype_so_far = -1
	for (var i = 0; i < population_size; i++) {
		var selected_idx = Math.floor(Math.random() * population_size)
		var selected_phenotype = population[selected_idx]
		new_population.push(selected_phenotype)

		if (all_the_same_phenotype_so_far == -1) {
			all_the_same_phenotype_so_far = selected_phenotype
		}

		if (all_the_same && all_the_same_phenotype_so_far != selected_phenotype) {
			all_the_same = false
		}
	}

	population = new_population

	// sort for an organized visual effect
	population = population.sort(function (a, b) {
		return a - b;
	});

	render()

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
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var width_per_cell = canvas.width / population_size

	for (var i = 0; i < population_size; i++) {
		var phenotype = population[i]

		var hue = 255 * (phenotype / population_size)

		ctx.fillStyle = "hsl(" + hue + ", 100%, 50%)"

		var x = width_per_cell * i
		ctx.fillRect(x, 0, width_per_cell + 2, canvas.height);
	}
}
