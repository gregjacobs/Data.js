/**
 * @class Data.attribute.Object
 * @extends Data.attribute.Attribute
 * 
 * Attribute definition class for an Attribute that takes an object value.
 */
/*global Data */
Data.attribute.Object = Data.attribute.Attribute.extend( {
	
	/**
	 * @cfg {Object} defaultValue
	 * @inheritdoc
	 */
	defaultValue : null,
	
	
	/**
	 * Overridden `beforeSet` method used to normalize the value provided. All non-object values are converted to null,
	 * while object values are returned unchanged.
	 * 
	 * @override
	 * @method beforeSet
	 * @inheritdoc
	 */
	beforeSet : function( model, newValue, oldValue ) {
		if( typeof newValue !== 'object' ) {
			newValue = null;  // convert all non-object values to null
		}
		
		return newValue;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'object', Data.attribute.Object );