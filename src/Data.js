// Note: Data license header automatically injected by build process.

/*global window */
/**
 * @class Data
 * @singleton
 * 
 * Main singleton class, namespace, and a few utility functions for the 
 * Data library. 
 */
var Data = {
	
	/**
	 * An empty function. This can be referred to in cases where you want a function
	 * but do not want to create a new function object. Used for performance and clarity
	 * reasons.
	 *
	 * @method emptyFn
	 */
	emptyFn : function() {},
	
	
	/**
	 * Creates namespaces to be used for scoping variables and classes so that they are not global.
	 * Specifying the last node of a namespace implicitly creates all other nodes. Usage:
	 * 
	 *     Data.namespace( 'Company', 'Company.data' );
	 *     Data.namespace( 'Company.data' ); // equivalent and preferable to above syntax
	 *     Company.Widget = function() { ... }
	 *     Company.data.CustomStore = function(config) { ... }
	 * 
	 * @param {String} namespace1
	 * @param {String} namespace2
	 * @param {String} etc...
	 * @return {Object} The namespace object. (If multiple arguments are passed, this will be the last namespace created)
	 * @method namespace
	 */
	namespace : function(){
		var o, d, i, len, j, jlen, ns,
		    args = arguments;   // var for minification collapse
		    
		for( i = 0, len = args.length; i < len; i++ ) {
			d = args[ i ].split( '.' );
			
			// First in the dot delimited string is the global
			o = window[ d[ 0 ] ] = window[ d[ 0 ] ] || {};
			
			// Now start at the second namespace in, to continue down the line of dot delimited namespaces to create
			for( j = 1, jlen = d.length; j < jlen; j++ ) {
				ns = d[ j ];  // the current namespace
				o = o[ ns ] = o[ ns ] || {};
			}
		}
		return o;
	}
	
};
