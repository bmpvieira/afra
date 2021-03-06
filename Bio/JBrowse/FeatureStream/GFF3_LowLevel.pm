=head1 NAME

Script::FlatFileToJson::FeatureStream::GFF3_LowLevel - feature stream
class for working with L<Bio::GFF3::LowLevel::Parser> features

=cut

package Bio::JBrowse::FeatureStream::GFF3_LowLevel;
use strict;
use warnings;

use base 'Bio::JBrowse::FeatureStream';
use URI::Escape qw(uri_unescape);

sub next_items {
    my ( $self ) = @_;
    while ( my $i = $self->{parser}->next_item ) {
        return $self->_to_hashref( $i ) if $i->{child_features};
    }
    return;
}

sub _to_hashref {
    my ( $self, $f ) = @_;
    # use Data::Dump 'dump';
    # if( ref $f ne 'HASH' ) {
    #     Carp::confess( dump $f );
    # }
    $f = { %$f };
    $f->{score} += 0 if defined $f->{score};
    $f->{phase} += 0 if defined $f->{phase};

    my $a = delete $f->{attributes};
    my %h;
    for my $key ( keys %$f) {
        my $lck = lc $key;
        my $v = $f->{$key};
        if( defined $v && ( ref($v) ne 'ARRAY' || @$v ) ) {
            unshift @{ $h{ $lck } ||= [] }, $v;
        }
    }

    # rename child_features to subfeatures
    if( $h{child_features} ) {
        $h{subfeatures} = [
            map {
                [ map $self->_to_hashref( $_ ), @$_ ]
            } @{delete $h{child_features}}
        ];
    }
    if( $h{derived_features} ) {
        $h{derived_features} = [
            map {
                [ map $self->_to_hashref( $_ ), @$_ ]
            } @{$h{derived_features}}
        ];
    }

    my %skip_attributes = ( Parent => 1 );
    for my $key ( sort keys %{ $a || {} } ) {
        my $lck = lc $key;
        if( !$skip_attributes{$key} ) {
            # push @{ $h{$lck} ||= [] }, @{$a->{$key}};
            push @{ $h{$lck} ||= [] }, uri_unescape("@{$a->{$key}}");
        }
    }

    my $flat = $self->_flatten_multivalues( \%h );
    return $flat;
}



1;
