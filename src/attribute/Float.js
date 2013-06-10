/*global define */
define( [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Number'
], function( _, Class, Attribute, NumberAttribute ) {
	
	/**
	 * @class data.attribute.Float
	 * @extends data.attribute.Number
	 * 
	 * Attribute definition class for an Attribute that takes a float (i.e. decimal, or "real") number data value.
	 */
	var FloatAttribute = Class.extend( NumberAttribute, {
		
		/**
		 * Implementation of abstract superclass method, which parses the number as a float.
		 * 
		 * @protected
		 * @param {String} input The input value to convert.
		 * @return {Number} The converted value as a float, or NaN if the value was unparsable.
		 */
		parseNumber : function( value ) {
			return parseFloat( value, 10 );
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'float', FloatAttribute );
	Attribute.registerType( 'number', FloatAttribute );
	
	return FloatAttribute;
	
} );