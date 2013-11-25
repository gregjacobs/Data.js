/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @private
	 * @class data.persistence.Util
	 * @singleton
	 * 
	 * Singleton utility class with helper methods for persistence-related functionality.
	 */
	var PersistenceUtil = Class.create( {
		
		/**
		 * Utility method used to normalize the `options` parameter for the options that are common to each of the "persistence" 
		 * methods of {@link data.DataComponent} subclasses ({@link data.Model Model} and {@link data.Collection Collection}. 
		 * This includes:
		 * 
		 * - {@link data.Model#load}
		 * - {@link data.Model#save}
		 * - {@link data.Model#destroy}
		 * - {@link data.Collection#method-load}
		 * - {@link data.Collection#loadRange}
		 * - {@link data.Collection#loadPage}
		 * - {@link data.Collection#loadPageRange}
		 * - {@link data.Collection#sync}
		 * 
		 * This method only operates on the properties listed below. It provides a default empty function for each of the 
		 * `success`, `error`, `cancel`, `progress`, and `complete` functions, and binds them to the `scope` (or `context`). 
		 * All other properties that exist on the `options` object will remain unchanged. 
		 * 
		 * @param {Object} [options] The options object provided to any of the "persistence" methods. If `undefined` or `null` is
		 *   provided, a normalized options object will still be returned, simply with defaults filled out.
		 * @param {Function} [options.success] Function to call if the persistence method is successful. Will be defaulted to an
		 *   empty function as part of this method's normalization process.
		 * @param {Function} [options.error] Function to call if the persistence method fails. Will be defaulted to an
		 *   empty function as part of this method's normalization process.
		 * @param {Function} [options.cancel] Function to call if the persistence method has been canceled, by the returned
		 *   Operation being {@link data.persistence.operation.Operation#abort aborted}.
		 * @param {Function} [options.progress] Function to call when progress has been made on the persistence Operation. This 
		 *   is called when an individual request has completed, or when the {@link #proxy} reports progress otherwise.
		 * @param {Function} [options.complete] Function to call when the persistence operation is complete, regardless
		 *   of success or failure. Will be defaulted to an empty function as part of this method's normalization process.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, `cancel`, `progress` and `complete` callbacks 
		 *   in. This may also be provided as the property `context`. Defaults to this DataComponent. This method binds each of
		 *   the callbacks to this object.
		 * @return {Object} The normalized `options` object.
		 */
		normalizePersistenceOptions : function( options ) {
			options = options || {};
			
			var emptyFn = function() {},
			    scope   = options.scope || options.context || this;
			
			options.success  = _.bind( options.success  || emptyFn, scope );
			options.error    = _.bind( options.error    || emptyFn, scope );
			options.cancel   = _.bind( options.cancel   || emptyFn, scope );
			options.progress = _.bind( options.progress || emptyFn, scope );
			options.complete = _.bind( options.complete || emptyFn, scope );
			
			return options;
		}
		
	} );
	
	
	// Return singleton instance
	return new PersistenceUtil();
	
} );