# Sling: *"quick tips"*

### *Useful Tools*
System Console/  
1. Sling/Resource Resolver
>   **resolve and map URLs** and more
2. Sling/Sling Servlet Resolver
>   observe the **servlets that render a response** to GET or POST request
3. OSGi/ Package Dependencies
>   **mvn dependency & bundle info** about specific **class or package**
4. OSGi/ Bundles
>   **list of bundles** and **info** about them

***

### *SlingPostServlet*  
**What is it?** Creates a content using HTTP POST request  
*HTTP form*:  

	<form method="POST" action="http://host/some/new/content" enctype="multipart/form-data">
		<input type="text" name="title" value="" />
		<input type="text" name="text" value="" />
	</form>

*With curl*:  
* Simple form  
  	$ curl -Ftitle="some title text" -Ftext="some body text content" http://host/some/new/content
* Specifying JCR node type (or could use `jcr:mixinTypes` instead)  
  	$ curl -F"jcr:primaryType=nt:unstructured" -Ftitle="some title text" \ -Ftext="some body text content" http://host/some/new/content
* Specifying Sling resource type  
  	$ curl -F"sling:resourceType=sling:sample" -Ftitle="some title text" \ -Ftext="some body text content" http://host/some/new/content

***

### *Sling-Initial-Content*  
List of bundles with initially loaded content in them:

1. ID:43  
> /org.apache.sling.starter.content-1.0.2.jar

2. ID:88  
> /composum-sling-core-commons-1.9.2.jar

3. ID:89  
> /composum-sling-core-config-1.9.2.jar

4. ID:90  
> /composum-sling-core-console-1.9.2.jar

5. ID:91  
> /composum-sling-core-jslibs-1.9.2.jar

6. ID:92  
> /composum-sling-package-manager-1.9.2.jar

7. ID:93  
> /composum-sling-user-management-1.9.2.jar

8. ID:151  
> /org.apache.sling.sample.slingshot-0.9.0.jar

9. ID:164  
> /org.apache.sling.scripting.sightly.repl-1.0.6.jar

10. ID:171  
> /org.apache.sling.validation.core-1.0.4.jar

11. ID:172  
> /org.apache.sling.xss-2.0.12.jar