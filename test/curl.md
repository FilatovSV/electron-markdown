# Curl: *"quick tips"*

### _Basics_  
	curl [options] [URL...]  

[Reference: link1][1]
[Reference: link2][2]
***
### _Curl for Sling_

* To create a **content node** (for some reason default "primaryType" is "sling:OrderedFolder"):

  	curl -u admin:admin -F"sling:resourceType=foo/bar" -F"title=some title" http://localhost:8080/content/mynode

* The resulting node

  	curl http://localhost:8080/content/mynode.json
  or
  	curl http://localhost:8080/content/mynode.html
  **But without the specified html-renderer html kind of request shows nothing.**

* To render the html version - store the script:

  Create the directory first:
  	curl -X MKCOL -u admin:admin http://localhost:8080/apps/foo  
  	curl -X MKCOL -u admin:admin http://localhost:8080/apps/foo/bar  
  Then upload the prepared script:  
  	curl -u admin:admin -T html.esp http://localhost:8080/apps/foo/bar/html.esp
  > Example of a script
  	<html>
  	  <body>
  	    <h1><%= currentNode.title %></h1>
  	  </body>
  	</html>

* > TODO: "additional examples" section will be added later...


***
[1]: <https://www.howtoforge.com/linux-curl-command/> ("howtoforge.com" tips)
[2]: <https://curl.haxx.se/docs/httpscripting.html> (cURl Tutorial)