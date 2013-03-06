/*global define */
define( [
	'lodash',
	'Class',
	'Observable'
], function( _, Class, Observable ) {

	/**
	 * @private
	 * @abstract
	 * @class Data.DataComponent
	 * @extends Observable
	 * 
	 * Base class for data-holding classes ({@link Data.Model} and {@link Data.Collection}), that abstracts out some
	 * of the commonalities between them.
	 * 
	 * This class is used internally by the framework, and shouldn't be used directly.
	 */
	var DataComponent = Class.extend( Observable, {
		abstractClass : true,
		
		
		/**
		 * @protected
		 * @property {String} clientId (readonly)
		 * 
		 * A unique ID for the Model on the client side. This is used to uniquely identify each Model instance.
		 * Retrieve with {@link #getClientId}.
		 */
		
		
		constructor : function() {
			// Call the superclass's constructor (Observable)
			this._super( arguments );
			
			// Create a client ID for the DataComponent
			this.clientId = 'c' + _.uniqueId();
		},
		
		
		/**
		 * Retrieves the DataComponent's unique {@link #clientId}.
		 * 
		 * @method getClientId
		 * @return {String} The DataComponent's unique {@link #clientId}. 
		 */
		getClientId : function() {
			return this.clientId;
		},
		
		
		/**
		 * Retrieves the native JavaScript value for the DataComponent.
		 * 
		 * @abstract
		 * @method getData
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link Data.data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link Data.data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link Data.attribute.Attribute Attribute} values.
		 */
		getData : Class.abstractMethod,
		
		
		/**
		 * Determines if the DataComponent has any modifications.
		 * 
		 * @abstract
		 * @method isModified
		 * 
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method.  Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link Data.attribute.Attribute#persist persisted} 
		 *   attribute of a Model is modified within the DataComponent. 
		 * 
		 * @return {Boolean}
		 */
		isModified : Class.abstractMethod,
		
		
		/**
		 * Commits the data in the DataComponent, so that it is no longer considered "modified".
		 * 
		 * @abstract
		 * @method commit
		 */
		commit : Class.abstractMethod,
		
		
		/**
		 * Rolls the data in the DataComponent back to its state before the last {@link #commit}
		 * or rollback.
		 * 
		 * @abstract
		 * @method rollback
		 */
		rollback : Class.abstractMethod
		
	} );
	
	return DataComponent;
	
} );