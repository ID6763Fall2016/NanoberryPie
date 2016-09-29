# Space_Monitor_Nanoberry_Pie
[+] init. 


This code uses node.js on the raspberry pi, to interface with the hardware and receive sensor signals
This data is later send to a Tingo database that collects it and creates a visualization for the data.

Node file to run: server.js (run using node server.js)


Hardware setup and pin connections are described below:

### Hardware parts:

1. Rasp-pi 3 with rasbian installed
2. ADS1115 Analog to Digital converter chip
3. MQ-135 gas sensor
4. Pyroelectric Infrared motion sensor (2 in number)
5. 10k ohm resistors (3 in number) to build voltage divider
6. LED (2 in number)


### Sensor IP/OP pins on Rasp-pi

1. PIR motion sensor 1 			= GPIO pin 4
2. PIR motion sensor 2 			= GPIO pin 22
3. LED 1 						= GPIO pin 18
4. LED 2 						= GPIO pin 27
5. MQ-135 gas sensor 			= A0 on ADS1115


### Setup Notes

This setup uses 12c protocol. We have used an ADS1115 as the Analog to digital converter.

It is normal for the gas sensor to heat up when connected.

LED pins are for visual representation of motion sensor readings and helps to check if the circuit is funcitoning correctly.

Place PIR motion sensors in a horizontal line with 3 - 4 inch gap between them. Sensor 1 to be placed closer to the door and sensor 2 to be placed closer to the stalls


### WARNING!!!

* If using a gas sensor that can be powered by 3.3v, there is no need to use a voltage divider bridge in the setup. Our current setup uses a voltage divider built using the 3 resistors, because our MQ-135 gas sensor required 5v power supply. Directly connecting the MQ-135 output to the raspberry pi without a voltage divider can damage the rasp-pi!

* Ensure that the gas sensor is kept far away from water or high moisture when placed in the environment.


