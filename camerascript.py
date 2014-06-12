# This script, when running, outputs all the variables that can be accessed into a text file.
# This will give you an idea what can be accessed, the names are pretty self explanatory
# Variables are accessed using sentry., for example accessing the x position of the tracked object use; xa=sentry.getposx()
# xa is now an array containing only the x position. To get x , simply say x=xa[0], and that is it

#import scriptexample
import sentry
import time
import json

class Object:
    def to_JSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

globvar1=0
globvar2=1

obj = Object()
obj.now = Object()
obj.max = Object()
obj.min = Object()
obj.now.x = 0
obj.now.y = 0
obj.min.x = 0
obj.min.y = 0
obj.max.x = 0
obj.max.y = 0

#When the main program is opened, look at the python tab, it contains a command saying stop script
#By pressing stop script sentry.getscriptrunning() returns a 0 value
#Looking at the while loop, globvar2 would then be 0, and the script would exit from the while loop

while globvar2 == 1 :
 globvar1=sentry.getscriptrunning()
 globvar2=globvar1[0]
 obj.now.x = sentry.getposx()[0]
 obj.now.y = sentry.getposy()[0]
 if obj.max.x < obj.now.x:
  obj.max.x = obj.now.x
 if obj.max.y < obj.now.y:
  obj.max.y = obj.now.y
 if obj.min.x > obj.now.x:
  obj.min.x = obj.now.x
 if obj.min.y > obj.now.y:
  obj.min.y = obj.now.y

 file = open("E:\\htdocs\\northernspark\\target.json", "w")
 file.write(obj.to_JSON())
 file.close()
 time.sleep(0.25)
 #globvar2=0
 #file.write(str(sentry.getposx()))
 #file.write(str(sentry.getposy()))
 #file.write(str(sentry.getposvx()))
 #file.write(str(sentry.getposvy()))
 #file.write(str(sentry.getposdx()))
 #file.write(str(sentry.getposdy()))
 #file.write(str(sentry.getwidth()))
 #file.write(str(sentry.getheight()))
 #file.write(str(sentry.getangle()))
 #file.write(str(sentry.getmousex()))
 #file.write(str(sentry.getmousey()))
 #file.write(str(sentry.getmouseclick()))
 #file.write(str(sentry.getaccumelatedobjects()))
 #file.write(str(sentry.getblobsfound()))
 #file.write(str(sentry.getpeoplefound()))
 #file.write(str(sentry.getistrackedaperson()))
 #file.write(str(sentry.getispeoplerecogon()))
 #file.write(str(sentry.gettimepassed()))
 #file.write(str(sentry.getframespassed()))
 #file.write(str(sentry.getscriptrunning()))
 #file.write("\n\n")

 #time.sleep(2)