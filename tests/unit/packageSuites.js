/*global Ext, tests */
(function() {
	tests.unit             = new Ext.test.TestSuite( 'unit' );
	tests.unit.attribute   = new Ext.test.TestSuite( 'attribute' )   .addTo( tests.unit );
	tests.unit.data        = new Ext.test.TestSuite( 'data' )        .addTo( tests.unit );
	tests.unit.persistence = new Ext.test.TestSuite( 'persistence' ) .addTo( tests.unit );
	
	Ext.test.Session.addSuite( tests.unit );
})();