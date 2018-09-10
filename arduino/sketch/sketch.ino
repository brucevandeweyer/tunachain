#include <Servo.h>
Servo lock;

const int temperaturePin = 0;
const int tiltPin = 3;
const int greenLed = 13;
const int redLed = 12;
int motorEnablePin = 6;
int switchPin1 = 4;
int switchPin2 = 5;

bool fishSpoiled;
bool fishSold;

void setup() {
  Serial.begin(9600);

  Serial.println("create");

  lock.attach(9);

  pinMode(greenLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  pinMode(switchPin1, OUTPUT);
  pinMode(switchPin2, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(tiltPin), tiltIsr, CHANGE);

  fishSpoiled = false;
  fishSold = false;
}

void loop() {
  if (!fishSold) 
  {
    checkSold();
    delay(5000);
    registerTemp();
    delay(5000);  
  }
}

// register current temperature
void registerTemp() {
  // check and send temperature
  float voltage = ((float)analogRead(temperaturePin))/1023*5; 
  float temperature = (voltage-0.5)*100;
  
  //dividing room temperature by 6 to simulate cold temperature
  float coldTemp = temperature/6;
  
  // activate motor if above 5.5°C activate motor
  if (coldTemp > 5.5)
  {
    analogWrite(motorEnablePin, temperature*2); 
    digitalWrite(switchPin1, HIGH); 
    digitalWrite(switchPin2, LOW); 
  }
  else
    stopMotor();
    
  // send temperature
  Serial.println((String)"t"+coldTemp);
}

// check if sold and adjust lock
void checkSold() {
  Serial.println("sold?");
  delay(1000);
  if (Serial.available() > 0) {
    fishSold = Serial.read();
  }
  if (fishSold)
  {
    digitalWrite(greenLed, HIGH);
    digitalWrite(redLed, LOW);
    lock.write(90);
  }
  else
  {
    digitalWrite(greenLed, LOW);
    digitalWrite(redLed, HIGH);
    lock.write(0);
  }
}

// register fish tilted
void tiltIsr() {
  // check if fish is already tilted
  if (!fishSpoiled) 
  {
    fishSpoiled = true;
    Serial.println("spoiled");
  }
}

void stopMotor() {
  analogWrite(motorEnablePin, 0); 
  digitalWrite(switchPin1, LOW); 
  digitalWrite(switchPin2, LOW); 
}


