build:
	# Builds everyting in ./src
	tsc
clean:
	rm ./src/*.js
	rm ./src/*.js.map
	rm ./src/curve/*.js
	rm ./src/curve/*.js.map
	rm ./src/kage/*.js
	rm ./src/kage/*.js.map
	rm ./src/fonts/gothic-web/*.js
	rm ./src/fonts/gothic-web/*.js.map
