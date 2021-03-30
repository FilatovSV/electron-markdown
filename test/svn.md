# SVN: "quick tips"
## That was neat.
***

1. svn checkout URL ./ - downloads content from specified "URL" to current dir
   URL example (for ace): svn+ssh://sergey@dinom.ru/home/P844/symseq/ace
2. svn update - updates current svn dir from the source
3. svn status - shows changes made inside of the svn dir
4. svn add ... - adds new changes
5. svn commit -m - commits added changes with commentary
6. svn log ... - shows log of changes for a certain file
7. svn diff -r 22:24 - shows differences between revisions 22 and 24