/*global define */
define( [
	'jquery',
	'lodash',
	'Class'
], function( jQuery, _, Class ) {
	
	/**
	 * @class spec.lib.MockAjax
	 * 
	 * A class for testing ajax functionality for the {@link data.persistence.proxy.Ajax AjaxProxy} and any
	 * subclasses. This class mocks jQuery's ajax functionality.
	 */
	var MockAjax = Class.create( {
		
		/**
		 * @protected
		 * @property {Array} jqXhrObjs
		 * 
		 * An array of the jqXHR objects that relate to the requests that have been made to the ajax function 
		 * (returned by {@link #getAjaxMethod}). The values of this array are mock jqXHR objects created in 
		 * {@link #doAjaxRequest}.
		 */
		
		
		/**
		 * @constructor
		 */
		constructor : function() {
			this.currentRequestIdx = -1;
			this.jqXhrObjs = [];
		},
		
		
		/**
		 * Returns the mocked ajax function, which when called, will populate this MockAjax instance
		 * making the arguments available for tests to inspect, and allowing tests to control when the
		 * request is {@link #resolveRequest resolved} or {@link #rejectRequest rejected}.
		 * 
		 * @return {Function}
		 */
		getAjaxMethod : function() {
			return _.bind( this.doAjaxRequest, this );
		},
		
		
		/**
		 * Performs the functionality of the mocked ajax request, by storing the request's `options`
		 * and its "jqXHR" instance.
		 * 
		 * @protected
		 * @return {jQuery.jqXHR} A mock jqXHR object.
		 */
		doAjaxRequest : function( options ) {
			var currentRequestIdx = ++this.currentRequestIdx;
			
			var deferred = new jQuery.Deferred();
			var jqXhr = {
				_deferred : deferred,  // simply attaching it here to make things easy for resolving or rejecting it later.
				_options : options,    // attaching here to make retrieving the options easier
				_aborted : false,      // will be updated when abortRequest() is called
				
				abort : _.bind( this.abortRequest, this, currentRequestIdx )
			};
			this.jqXhrObjs[ currentRequestIdx ] = jqXhr;
			
			return deferred.promise( jqXhr );  // make the jqXhr object into a promise, and return the jqXhr object
		},
		
		
		/**
		 * Retrieves the number of requests that have been made to the ajax function (returned by {@link #getAjaxMethod}).
		 * 
		 * @return {Number}
		 */
		getRequestCount : function() {
			return this.jqXhrObjs.length;
		},
		
		
		/**
		 * Retrieves the original `options` object that was passed to the ajax method for a given request.
		 * 
		 * @param {Number} requestIdx The index of the request that has been made to retrieve the options for.
		 * @return {Object} The options object provided to the ajax function (returned by {@link #getAjaxMethod}).
		 */
		getOptions : function( requestIdx ) {
			return this.jqXhrObjs[ requestIdx ]._options;
		},
		
		
		/**
		 * Determines if a request was aborted.
		 * 
		 * @param {Number} requestIdx The index of the request that has been made to determine if it has been aborted.
		 * @return {Boolean}
		 */
		wasAborted : function( requestIdx ) {
			return this.jqXhrObjs[ requestIdx ]._aborted;
		},
		
		
		/**
		 * Resolves a request that has been made to the ajax function (returned by {@link #getAjaxMethod}).
		 * 
		 * @param {Number} requestIdx The index of the request that has been made which should be resolved.
		 * @param {Mixed} data The data that was "returned" in response to the request.
		 * @param {String} [textStatus=success]
		 */
		resolveRequest : function( requestIdx, data, textStatus ) {
			var jqXhr = this.jqXhrObjs[ requestIdx ];
			
			jqXhr._deferred.resolve( data, textStatus || "success", jqXhr );
		},
		
		
		/**
		 * Rejects a request that has been made to the ajax function (returned by {@link #getAjaxMethod}).
		 * 
		 * @param {Number} requestIdx The index of the request that has been made which should be rejected.
		 * @param {String} [textStatus=error] The text status for the errored request.
		 * @param {String} [errorThrown=error] The error thrown.
		 */
		rejectRequest : function( requestIdx, textStatus, errorThrown ) {
			var jqXhr = this.jqXhrObjs[ requestIdx ];
			
			jqXhr._deferred.reject( jqXhr, textStatus || "error", errorThrown || "error" );
		},
		
		
		/**
		 * Aborts a request that has been made to ajax function (returned by {@link #getAjaxMethod}).
		 * 
		 * @param {Number} requestIdx The index of the request that has been made which should be aborted.
		 */	
		abortRequest : function( requestIdx ) {
			var jqXhr = this.jqXhrObjs[ requestIdx ];
			
			// Only set 'aborted' to true if the request is still in progress. This helps test to see if the 
			// 'aborted' flag was actually set because the request was still in progress. Helps us determine
			// if abort() was called at the wrong time. 
			if( jqXhr.state() === 'pending' ) {
				jqXhr._aborted = true;
				this.rejectRequest( requestIdx, "abort", "abort" );
			}
		}
		
	} );
	
	
	return MockAjax;
	
} );