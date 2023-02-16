import {
  benchmark_build_levels,
  benchmark_draw_coords,
  benchmark_update_everything,
} from "./scene.js";
import { benchmark_collision } from "./collision.js";

function run_benchmark_n_times(benchmark, n) {
  let result_times = new Array();
  for (let i = 0; i < n; ++i) {
    result_times.push(benchmark());
  }
  result_times.sort();
  return result_times[0];
}

function run_all() {
  const runs = 20;
  console.log("Number of benchmark runs:", runs);
  console.log(
    "Calculate draw coords (ms):",
    run_benchmark_n_times(benchmark_draw_coords, runs),
  );
  console.log(
    "Calculate build levels (ms):",
    run_benchmark_n_times(benchmark_build_levels, runs),
  );
  console.log(
    "Build levels and update everything (ms):",
    run_benchmark_n_times(benchmark_update_everything, runs),
  );
  console.log(
    "Collision detection (ms):",
    run_benchmark_n_times(benchmark_collision, runs),
  );
}
run_all();
