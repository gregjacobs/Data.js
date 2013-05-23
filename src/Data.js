/*global define */
define( function() {
	
	/**
	 * @class data.Data
	 * @singleton
	 * 
	 * Main singleton class and a few utility functions for the Data.js library. 
	 */
	var Data = {
		
		/**
		 * An empty function which can be used in place of creating a new function object. 
		 * 
		 * This is useful for contexts where say, a callback function is called, but the user
		 * has not provided their own implementation (i.e. an optional callback). Also useful
		 * for creating hook methods in classes. Basically the same thing as `jQuery.noop()`.
		 *
		 * @method emptyFn
		 */
		emptyFn : function() {}
		
	};
	
	return Data;
	
} );
