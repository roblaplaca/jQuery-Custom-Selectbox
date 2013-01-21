Custom Selectbox
=======================

SelectBox replacement using jQuery. Hides the selectbox and replaces it with an easy to style css version.  

![example selectbox](http://roblaplaca.com/blog/wp-content/uploads/2013/01/Screen-shot-2013-01-20-at-5.25.36-PM.png)
![example selectbox](http://roblaplaca.com/blog/wp-content/uploads/2013/01/Screen-shot-2013-01-20-at-5.24.45-PM.png)

Features include:

* **Custom scrollbar** - by default custom scrollbars using jScrollPane are enabled. You can also use the default browser one, but that doesn't look nice.
* **Icon Support** - If an option has a CSS class, that will  get carried over to the generated selectbox code as a span with a classname which can then be styled.
* **Keyboard access** - If you focus on a select, you can hit up/down, or even type in text and it will update like a regular select.
* **Opt Groups** - Like a regular selectbox, it supports optgroups. If those are in the HTML markup, then they will show up in the custom one.
It's driven by a real selectbox, so it will pass values in forms. The way it works is that the code will find the selectbox and hide it. Then the JS will generate a fake "custom" selectbox which can be styled. All interactions are routed back to the existing selectbox though. So... if you change the custom one, the real one will be synced as well. This way when you're submitting a form with a custom select, you don't lose the value.
* **No JavaScript mode** - If JavaScript isn't turned on it just displays a regular selectbox instead.
* **Interface** - There are public methods for syncing the select box if it is updated, and also for disabling it. So it's pretty easy to wire it up with complex functionality. 
* **Browser support** - I tested it in Firefox, Chrome, Safari, IE7+ (with a few style tweaks IE6 will work fine too)
