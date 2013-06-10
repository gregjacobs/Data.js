/*global define */
define( [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Number'
], function( _, Class, Attribute, NumberAttribute ) {
	
	/**
	 * @class data.attribute.Integer
	 * @extends data.attribute.Number
	 * 
	 * Attribute definition class for an Attribute that takes an integer data value. If a decimal
	 * number is provided (i.e. a "float"), the decimal will be ignored, and only the integer value used.
	 */
	var IntegerAttribute = Class.extend( NumberAttribute, {
		
		/**
		 * Implementation of abstract superclass method, which parses the number as an integer.
		 * 
		 * @protected
		 * @param {String} input The input value to convert.
		 * @return {Number} The converted value as an integer, or NaN if the value was unparsable.
		 */
		parseNumber : function( value ) {
			return parseInt( value, 10 );
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'int', IntegerAttribute );
	Attribute.registerType( 'integer', IntegerAttribute );
	
	return IntegerAttribute;
	
} );