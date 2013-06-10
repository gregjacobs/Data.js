/*global define */
define( [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Primitive'
], function( _, Class, Attribute, PrimitiveAttribute ) {
	
	/**
	 * @abstract
	 * @class data.attribute.Number
	 * @extends data.attribute.Primitive
	 * 
	 * Abstract base class for an Attribute that takes a number data value.
	 */
	var NumberAttribute = PrimitiveAttribute.extend( {
		abstractClass: true,
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * @inheritdoc
		 * 
		 * The Number Attribute defaults to 0, unless the {@link #useNull} config is 
		 * set to `true`, in which case it defaults to `null`.
		 */
		defaultValue: function() {
			return this.useNull ? null : 0;
		},
		
		
		/**
		 * @cfg {Boolean} useNull
		 * 
		 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
		 * Attribute is "unset", and it shouldn't take an actual default value).
		 * 
		 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
		 * cannot be parsed into an integer (i.e. if it's undefined, null, empty string, string with alpha characters in it,
		 * or other data type), `null` will be used instead of converting to 0.
		 */
		
		
		/**
		 * @protected
		 * @property {RegExp} stripCharsRegex 
		 * 
		 * A regular expression for stripping non-numeric characters from a numeric value. Defaults to `/[\$,%]/g`.
		 * This should be overridden for localization. A way to do this globally is, for example:
		 * 
		 *     require( [ 'data/attribute/Number' ], function( NumberAttribute ) {
		 *         NumberAttribute.prototype.stripCharsRegex = /newRegexHere/g;
		 *     } );
		 */
		stripCharsRegex : /[\$,%]/g,
		

		/**
		 * Override of superclass method used to convert the provided data value into a number. If {@link #useNull} is true, 
		 * undefined/null/empty string/unparsable values will return `null`, or else will otherwise be converted to 0.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Number} The converted value.
		 */
		convert : function( value ) {
			value = this._super( arguments );
			value = this.parseNumber( String( value ).replace( this.stripCharsRegex, '' ) );

			return ( isNaN( value ) ) ? this.getDefaultValue() : value;
		},
		
		
		/**
		 * Abstract method which should implement the parsing function for the number (ex: `parseInt()` or `parseFloat()`).
		 * 
		 * @protected
		 * @abstract
		 * @method parseNumber
		 * @param {String} input The input value, as a string.
		 * @return {Number} The parsed number, or NaN if the input string was unparsable.
		 */
		parseNumber : Class.abstractMethod
		
	} );
	
	return NumberAttribute;
	
} );