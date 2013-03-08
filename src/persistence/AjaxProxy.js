/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/persistence/Proxy'
], function( jQuery, _, Class, Data, Proxy ) {
	
	/**
	 * @class Data.persistence.AjaxProxy
	 * @extends Data.persistence.Proxy
	 * 
	 * AjaxProxy is responsible for performing CRUD operations through standard AJAX, using the url(s) configured,
	 * and providing any parameters and such which are required for the backend service.
	 */
	var AjaxProxy = Class.extend( Proxy, {
		
		
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'ajax', RestProxy );
	
	return AjaxProxy;
	
} );