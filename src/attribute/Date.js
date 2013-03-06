/*global define */
define( [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Object'
], function( _, Class, Attribute, ObjectAttribute ) {
	
	/**
	 * @class Data.attribute.Date
	 * @extends Data.attribute.Object
	 * 
	 * Attribute definition class for an Attribute that takes a JavaScript Date object.
	 */
	var DateAttribute = Class.extend( ObjectAttribute, {
			
		/**
		 * Converts the provided data value into a Date object. If the value provided is not a Date, or cannot be parsed
		 * into a Date, will return null.
		 * 
		 * @method beforeSet
		 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
		 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
		 * @return {Boolean} The converted value.
		 */
		beforeSet : function( model, newValue, oldValue ) {
			if( !newValue ) {
				return null;
			}
			if( _.isDate( newValue ) ) {
				return newValue;
			}
			
			var parsed = Date.parse( newValue );
			return ( parsed ) ? new Date( parsed ) : null;
		}
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'date', DateAttribute );
	
	return DateAttribute;
	
} );